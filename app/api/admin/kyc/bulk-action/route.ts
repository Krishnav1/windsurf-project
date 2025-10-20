/**
 * Bulk KYC Actions API
 * POST: Approve/reject multiple documents at once
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';
import { EncryptionService } from '@/lib/security/encryption';
import { batchUpdateKycStatus } from '@/lib/services/kycStatusService';
import { sanitizeError, logError } from '@/lib/utils/errorHandler';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const { data: admin } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (admin?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { documentIds, action, comments } = await request.json();

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'Document IDs required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const results = [];
    const batchSize = 10;
    const affectedUserIds = new Set<string>();
    
    // Process in batches
    for (let i = 0; i < documentIds.length; i += batchSize) {
      const batch = documentIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (docId: string) => {
        try {
          // Get document
          const { data: doc } = await supabaseAdmin
            .from('kyc_documents')
            .select('*, users!kyc_documents_user_id_fkey(id, email)')
            .eq('id', docId)
            .single();

          if (!doc) {
            return { docId, success: false, error: 'Document not found' };
          }

          // Encrypt comments
          let encryptedComments = null;
          if (comments) {
            const encrypted = EncryptionService.encrypt(comments);
            encryptedComments = {
              encrypted: encrypted.encrypted,
              iv: encrypted.iv,
              authTag: encrypted.authTag
            };
          }

          const newStatus = action === 'approve' ? 'approved' : 'rejected';

          // Encrypt rejection reason if provided
          let encryptedRejection = null;
          if (action === 'reject' && comments) {
            const encrypted = EncryptionService.encrypt(comments);
            encryptedRejection = JSON.stringify({
              encrypted: encrypted.encrypted,
              iv: encrypted.iv,
              authTag: encrypted.authTag
            });
          }

          // Update document
          const { error: updateError } = await supabaseAdmin
            .from('kyc_documents')
            .update({
              status: newStatus,
              reviewed_by: admin.id,
              reviewed_at: new Date().toISOString(),
              rejection_reason: encryptedRejection
            })
            .eq('id', docId);
          
          if (updateError) {
            throw new Error(`Failed to update document: ${updateError.message}`);
          }

          // Track affected user for status update later
          affectedUserIds.add(doc.user_id);

          // Log history
          const { error: historyError } = await supabaseAdmin
            .from('document_verification_history')
            .insert({
              document_id: docId,
              document_table: 'kyc_documents',
              action,
              performed_by: admin.id,
              comments_encrypted: encryptedComments?.encrypted,
              comments_iv: encryptedComments?.iv,
              comments_auth_tag: encryptedComments?.authTag,
              previous_status: doc.status,
              new_status: newStatus,
              verification_method: 'bulk',
              created_at: new Date().toISOString()
            });
          
          if (historyError) {
            logError('Bulk History Log', historyError, { docId });
          }

          // Don't update user status here - will be done after batch to avoid race conditions

          // Send notification (without exposing sensitive comments)
          const { error: notificationError } = await supabaseAdmin
            .from('notifications')
            .insert({
              user_id: doc.user_id,
              type: 'kyc_status_update',
              title: `KYC ${action === 'approve' ? 'Approved' : 'Rejected'}`,
              message: action === 'approve'
                ? `Your ${doc.document_type} document has been approved.`
                : `Your ${doc.document_type} document requires resubmission. Please check your email for details.`,
              priority: 'high',
              read: false,
              created_at: new Date().toISOString()
            });
          
          if (notificationError) {
            logError('Bulk Notification', notificationError, { docId, userId: doc.user_id });
          }

          return { docId, success: true, userId: doc.user_id };

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { docId, success: false, error: errorMessage };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Rate limiting between batches
      if (i + batchSize < documentIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Update user KYC statuses after all documents processed (prevents race conditions)
    const userStatusResults = await batchUpdateKycStatus(Array.from(affectedUserIds));

    // Log bulk action
    const { error: auditError } = await supabaseAdmin
      .from('audit_logs_enhanced')
      .insert({
        user_id: admin.id,
        action: 'bulk_kyc_verification',
        resource_type: 'kyc_documents',
        details: {
          documentCount: documentIds.length,
          action,
          results: results.map(r => ({ docId: r.docId, success: r.success }))
        },
        severity: 'info',
        created_at: new Date().toISOString()
      });
    
    if (auditError) {
      logError('Bulk Audit Log', auditError, { adminId: admin.id });
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      message: `Bulk action completed: ${successCount} succeeded, ${failCount} failed`,
      results,
      userStatusUpdates: userStatusResults // Return array directly instead of converting to object
    });

  } catch (error) {
    logError('Bulk Action', error as Error);
    return NextResponse.json({ error: sanitizeError(error as Error) }, { status: 500 });
  }
}
