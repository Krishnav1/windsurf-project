/**
 * Bulk KYC Actions API
 * POST: Approve/reject multiple documents at once
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';
import { EncryptionService } from '@/lib/security/encryption';

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

          // Update document
          await supabaseAdmin
            .from('kyc_documents')
            .update({
              status: newStatus,
              reviewed_by: admin.id,
              reviewed_at: new Date().toISOString(),
              rejection_reason: action === 'reject' ? comments : null
            })
            .eq('id', docId);

          // Log history
          await supabaseAdmin
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

          // Check user's overall KYC status
          const { data: allUserDocs } = await supabaseAdmin
            .from('kyc_documents')
            .select('status')
            .eq('user_id', doc.user_id);

          const allApproved = allUserDocs?.every(d => d.status === 'approved');
          const hasRejected = allUserDocs?.some(d => d.status === 'rejected');

          const userKycStatus = allApproved ? 'approved' : hasRejected ? 'rejected' : 'pending';

          await supabaseAdmin
            .from('users')
            .update({ kyc_status: userKycStatus })
            .eq('id', doc.user_id);

          // Send notification
          await supabaseAdmin
            .from('notifications')
            .insert({
              user_id: doc.user_id,
              type: 'kyc_status_update',
              title: `KYC ${action === 'approve' ? 'Approved' : 'Rejected'}`,
              message: action === 'approve'
                ? 'Your KYC document has been approved.'
                : `Your KYC document was rejected. ${comments || ''}`,
              priority: 'high',
              read: false,
              created_at: new Date().toISOString()
            });

          return { docId, success: true, userKycStatus };

        } catch (error: any) {
          return { docId, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Rate limiting between batches
      if (i + batchSize < documentIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Log bulk action
    await supabaseAdmin
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

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      message: `Bulk action completed: ${successCount} succeeded, ${failCount} failed`,
      results
    });

  } catch (error: any) {
    console.error('Bulk action error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
