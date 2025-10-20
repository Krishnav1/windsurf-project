/**
 * KYC Documents API for Investors
 * GET: Get user's uploaded KYC documents with edit window check
 * DELETE: Delete a specific document (only within 15-min window)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';

const EDIT_WINDOW_MINUTES = 15;

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
    console.error('Get KYC documents error:', error);
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

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
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

    // Check if document is within edit window
    const uploadedAt = new Date(document.uploaded_at);
    const now = new Date();
    const minutesSinceUpload = (now.getTime() - uploadedAt.getTime()) / (1000 * 60);

    if (minutesSinceUpload > EDIT_WINDOW_MINUTES) {
      return NextResponse.json({ 
        error: 'Edit window expired. Documents can only be deleted within 15 minutes of upload.',
        editWindowExpired: true
      }, { status: 403 });
    }

    if (document.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Cannot delete document that has been reviewed',
        status: document.status
      }, { status: 403 });
    }

    // Delete file from storage
    if (document.file_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('kyc-documents')
        .remove([document.file_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with DB deletion even if storage fails
      }
    }

    // Delete document record
    const { error: deleteError } = await supabaseAdmin
      .from('kyc_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete KYC document error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
