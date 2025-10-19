/**
 * Upload Document API
 * Upload legal documents for assets
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';
import crypto from 'crypto';

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

    // Upload to Supabase Storage
    const fileName = `${assetId}/${documentType}_${Date.now()}.pdf`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('assets-documents')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from('assets-documents')
      .getPublicUrl(fileName);

    // Save to database
    const { data: document, error: dbError } = await supabaseAdmin
      .from('asset_documents')
      .insert({
        asset_id: assetId,
        document_type: documentType,
        document_name: documentName,
        file_url: publicUrl,
        file_hash: fileHash,
        file_size: file.size,
        is_public: true
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });
    }

    // Log audit
    await supabaseAdmin.from('audit_logs').insert({
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

  } catch (error: any) {
    console.error('Upload document error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
