/**
 * KYC Documents API for Investors
 * GET: Get user's uploaded KYC documents with edit window check
 * DELETE: Delete a specific document (only within 3-min window)
 * IFSCA Compliant - Audit logging + deletion limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';
import { PinataService } from '@/lib/ipfs/pinataService';

const EDIT_WINDOW_MINUTES = 3; // Changed from 15 to 3 minutes
const MAX_DELETIONS_PER_TYPE_PER_DAY = 3;

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
    }

    // Get user's KYC documents
    const { data: documents, error } = await supabaseAdmin
      .from('kyc_documents')
      .select('*')
      .eq('user_id', decoded.userId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Calculate if documents are within edit window
    const now = new Date();
    const documentsWithEditWindow = documents?.map(doc => {
      const uploadedAt = new Date(doc.uploaded_at);
      const minutesSinceUpload = (now.getTime() - uploadedAt.getTime()) / (1000 * 60);
      const canEdit = minutesSinceUpload <= EDIT_WINDOW_MINUTES && doc.status === 'pending';
      const remainingMinutes = canEdit ? Math.ceil(EDIT_WINDOW_MINUTES - minutesSinceUpload) : 0;

      return {
        ...doc,
        canEdit,
        remainingMinutes,
        editWindowExpired: !canEdit && doc.status === 'pending'
      };
    });

    return NextResponse.json({
      success: true,
      documents: documentsWithEditWindow || [],
      editWindowMinutes: EDIT_WINDOW_MINUTES
    });

  } catch (error: any) {
    console.error('Get KYC documents error:', { errorType: error.constructor.name });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');
    const reason = searchParams.get('reason') || 'User requested deletion';

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    if (!reason || reason.length < 10) {
      return NextResponse.json({ 
        error: 'Deletion reason required (minimum 10 characters)' 
      }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
    }

    // Get document to verify ownership and check edit window
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('kyc_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', decoded.userId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check deletion limit (max 3 deletions per document type per day)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: recentDeletions, error: deletionCheckError } = await supabaseAdmin
      .from('kyc_document_deletions')
      .select('id')
      .eq('user_id', decoded.userId)
      .eq('document_type', document.document_type)
      .gte('deleted_at', oneDayAgo.toISOString());

    if (deletionCheckError) {
      console.error('Deletion check error:', deletionCheckError);
    }

    const deletionCount = recentDeletions?.length || 0;
    if (deletionCount >= MAX_DELETIONS_PER_TYPE_PER_DAY) {
      return NextResponse.json({ 
        error: `Maximum ${MAX_DELETIONS_PER_TYPE_PER_DAY} deletions per document type per day exceeded`,
        deletionCount,
        maxDeletions: MAX_DELETIONS_PER_TYPE_PER_DAY
      }, { status: 429 });
    }

    // Check if document is within edit window
    const uploadedAt = new Date(document.uploaded_at);
    const now = new Date();
    const minutesSinceUpload = (now.getTime() - uploadedAt.getTime()) / (1000 * 60);

    if (minutesSinceUpload > EDIT_WINDOW_MINUTES) {
      return NextResponse.json({ 
        error: `Edit window expired. Documents can only be deleted within ${EDIT_WINDOW_MINUTES} minutes of upload.`,
        editWindowExpired: true,
        minutesSinceUpload: Math.floor(minutesSinceUpload)
      }, { status: 403 });
    }

    if (document.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Cannot delete document that has been reviewed',
        status: document.status
      }, { status: 403 });
    }

    // Delete from IPFS if exists
    if (document.ipfs_hash) {
      try {
        await PinataService.unpinFile(document.ipfs_hash);
        console.log('[Delete] Unpinned from IPFS:', document.ipfs_hash);
      } catch (ipfsError) {
        console.error('IPFS unpin error:', ipfsError);
        // Continue - non-critical
      }
    }

    // Delete file from Supabase storage (backup)
    if (document.file_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('kyc-documents')
        .remove([document.file_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with DB deletion even if storage fails
      }
    }

    // Log deletion to audit trail BEFORE deleting
    await supabaseAdmin
      .from('kyc_document_deletions')
      .insert({
        user_id: decoded.userId,
        document_id: documentId,
        document_type: document.document_type,
        file_name: document.file_name,
        file_hash: document.file_hash,
        ipfs_hash: document.ipfs_hash,
        reason,
        deleted_at: new Date().toISOString(),
        deletion_count: deletionCount + 1,
        minutes_since_upload: Math.floor(minutesSinceUpload)
      });

    // Log to enhanced audit logs
    await supabaseAdmin
      .from('audit_logs_enhanced')
      .insert({
        user_id: decoded.userId,
        action: 'kyc_document_deleted',
        resource_type: 'kyc_documents',
        resource_id: documentId,
        details: {
          documentType: document.document_type,
          fileName: document.file_name,
          reason,
          minutesSinceUpload: Math.floor(minutesSinceUpload),
          deletionCount: deletionCount + 1,
          ipfsHash: document.ipfs_hash
        },
        severity: 'warning',
        created_at: new Date().toISOString()
      });

    // Delete document record (with status check to prevent race condition)
    const { error: deleteError } = await supabaseAdmin
      .from('kyc_documents')
      .delete()
      .eq('id', documentId)
      .eq('status', 'pending'); // Only delete if still pending

    if (deleteError) {
      throw deleteError;
    }

    console.log('[Delete] ✅ Document deleted:', {
      documentId,
      documentType: document.document_type,
      reason,
      deletionCount: deletionCount + 1
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
      deletionCount: deletionCount + 1,
      remainingDeletions: MAX_DELETIONS_PER_TYPE_PER_DAY - (deletionCount + 1)
    });

  } catch (error: any) {
    console.error('Delete KYC document error:', { errorType: error.constructor.name });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
