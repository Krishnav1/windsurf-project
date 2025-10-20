/**
 * Admin KYC Verification API
 * POST: Approve or reject KYC documents
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
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify admin role
    const { data: admin } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (admin?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { documentId, action, comments, verificationLevel } = body;

    if (!documentId || !action) {
      return NextResponse.json(
        { error: 'Document ID and action required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'flag'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get document
    const { data: document, error: docError } = await supabaseAdmin
      .from('kyc_documents')
      .select('*, users!kyc_documents_user_id_fkey(*)')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Encrypt comments if provided
    let encryptedComments = null;
    if (comments) {
      const encrypted = EncryptionService.encrypt(comments);
      encryptedComments = {
        encrypted: encrypted.encrypted,
        iv: encrypted.iv,
        authTag: encrypted.authTag
      };
    }

    // Update document status
    const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'flagged';
    
    await supabaseAdmin
      .from('kyc_documents')
      .update({
        status: newStatus,
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: action === 'reject' ? comments : null,
        verification_level: verificationLevel || 'L1'
      })
      .eq('id', documentId);

    // Log verification history
    const { error: historyError } = await supabaseAdmin
      .from('document_verification_history')
      .insert({
        document_id: documentId,
        document_table: 'kyc_documents',
        action,
        performed_by: admin.id,
        comments_encrypted: encryptedComments?.encrypted,
        comments_iv: encryptedComments?.iv,
        comments_auth_tag: encryptedComments?.authTag,
        previous_status: document.status,
        new_status: newStatus,
        verification_method: 'manual',
        created_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('Failed to log verification history:', historyError);
      // Consider whether to fail the request or continue
    }

    // Check if all user's documents are approved
    const { data: allUserDocs } = await supabaseAdmin
      .from('kyc_documents')
      .select('status')
      .eq('user_id', document.user_id);

    const allApproved = allUserDocs?.every(doc => doc.status === 'approved');
    const hasRejected = allUserDocs?.some(doc => doc.status === 'rejected');

    // Update user KYC status
    let userKycStatus = 'pending';
    if (allApproved) {
      userKycStatus = 'approved';
    } else if (hasRejected) {
      userKycStatus = 'rejected';
    }

    await supabaseAdmin
      .from('users')
      .update({ kyc_status: userKycStatus })
      .eq('id', document.user_id);

    // Create notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: document.user_id,
        type: 'kyc_status_update',
        title: `KYC ${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Flagged'}`,
        message: action === 'approve'
          ? 'Your KYC document has been approved.'
          : action === 'reject'
          ? `Your KYC document was rejected. Reason: ${comments}`
          : 'Your KYC document has been flagged for review.',
        priority: 'high',
        read: false,
        created_at: new Date().toISOString()
      });

    // Log audit
    await supabaseAdmin
      .from('audit_logs_enhanced')
      .insert({
        user_id: admin.id,
        action: `kyc_${action}`,
        resource_type: 'kyc_document',
        resource_id: documentId,
        details: {
          targetUser: document.users.email,
          documentType: document.document_type,
          action,
          hasComments: !!comments
        },
        severity: 'info',
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      message: `Document ${action}ed successfully`,
      userKycStatus
    });

  } catch (error: any) {
    console.error('KYC verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
