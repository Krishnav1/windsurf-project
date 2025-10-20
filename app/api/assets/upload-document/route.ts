/**
 * Upload Document API
 * Upload legal documents for assets
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';
import crypto from 'crypto';
import { uploadWithPublicUrl } from '@/lib/storage/storageService';
import { sanitizeError, logError } from '@/lib/utils/errorHandler';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const assetId = formData.get('assetId') as string;
    const documentType = formData.get('documentType') as string;
    const documentName = formData.get('documentName') as string;

    if (!file || !assetId || !documentType || !documentName) {
      return NextResponse.json({ 
        error: 'File, asset ID, document type, and name required' 
      }, { status: 400 });
    }

    // Validate file type (PDF only)
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files allowed' }, { status: 400 });
    }

    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 });
    }

    // Verify asset ownership
    const { data: asset } = await supabaseAdmin
      .from('tokens')
      .select('issuer_id')
      .eq('id', assetId)
      .single();

    if (!asset || asset.issuer_id !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Calculate file hash
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Upload to Supabase Storage with proper error handling
    const uniqueId = crypto.randomUUID();
    const fileName = `${assetId}/${documentType}_${uniqueId}.pdf`;

    let publicUrl: string;
    let filePath: string;
    
    try {
      const uploadResult = await uploadWithPublicUrl(
        'assets-documents',
        fileName,
        buffer,
        { contentType: 'application/pdf', upsert: false }
      );
      publicUrl = uploadResult.publicUrl;
      filePath = uploadResult.filePath;
    } catch (uploadError) {
      logError('Asset Document Upload', uploadError as Error, { assetId });
      return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
    }

    // Save to database with file_path
    const { data: document, error: dbError } = await supabaseAdmin
      .from('asset_documents')
      .insert({
        asset_id: assetId,
        document_type: documentType,
        document_name: documentName,
        file_url: publicUrl,
        file_path: filePath,
        file_hash: fileHash,
        file_size: file.size,
        is_public: true
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: Delete uploaded file to prevent orphaned files
      try {
        await supabaseAdmin.storage
          .from('assets-documents')
          .remove([filePath]);
      } catch (cleanupError) {
        logError('File Cleanup Failed', cleanupError as Error, { filePath, assetId });
      }
      logError('Asset Document DB Insert', dbError, { assetId });
      return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });
    }

    // Log audit
    const { error: auditError } = await supabaseAdmin.from('audit_logs').insert({
      user_id: decoded.userId,
      action: 'document_uploaded',
      resource_type: 'asset_document',
      resource_id: document.id,
      details: {
        assetId,
        documentType,
        documentName,
        fileHash
      },
      severity: 'info'
    });
    
    if (auditError) {
      logError('Asset Document Audit', auditError, { assetId, documentId: document.id });
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: documentName,
        type: documentType,
        url: publicUrl,
        hash: fileHash,
        size: file.size
      }
    });

  } catch (error) {
    logError('Upload Document', error as Error);
    return NextResponse.json(
      { error: sanitizeError(error as Error) },
      { status: 500 }
    );
  }
}
