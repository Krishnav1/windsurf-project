/**
 * KYC Document Fetch & Decrypt API
 * Allows authorized users to view/download encrypted documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';
import { DocumentEncryptionService } from '@/lib/security/documentEncryption';
import { logError } from '@/lib/utils/errorHandler';

export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { documentId } = params;
    
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // Fetch document metadata
    const { data: document, error: docError } = await supabaseAdmin
      .from('kyc_documents')
      .select('*, users!inner(id, role)')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Authorization check
    const isOwner = document.user_id === decoded.userId;
    const isAdmin = decoded.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Log document access
    await supabaseAdmin
      .from('audit_logs_enhanced')
      .insert({
        user_id: decoded.userId,
        action: 'kyc_document_accessed',
        resource_type: 'kyc_documents',
        resource_id: documentId,
        details: {
          document_type: document.document_type,
          accessed_by_role: decoded.role,
          owner_id: document.user_id
        },
        severity: 'info',
        created_at: new Date().toISOString()
      });

    // Return document metadata (frontend will fetch and decrypt)
    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        document_type: document.document_type,
        file_name: document.file_name,
        file_type: document.file_type,
        file_size: document.file_size,
        file_url: document.file_url,
        ipfs_hash: document.ipfs_hash,
        ipfs_url: document.ipfs_url,
        encryption_iv: document.encryption_iv,
        encryption_auth_tag: document.encryption_auth_tag,
        encryption_salt: document.encryption_salt,
        encrypted: document.encrypted,
        status: document.status,
        uploaded_at: document.uploaded_at
      }
    });

  } catch (error) {
    logError('KYC Document Fetch', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

/**
 * Download decrypted document
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { documentId } = params;
    
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // Fetch document
    const { data: document, error: docError } = await supabaseAdmin
      .from('kyc_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Authorization check
    const isOwner = document.user_id === decoded.userId;
    const isAdmin = decoded.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch encrypted file from IPFS/Supabase
    let encryptedBuffer: Buffer;
    
    if (document.ipfs_url) {
      // Fetch from IPFS
      const ipfsResponse = await fetch(document.file_url);
      if (!ipfsResponse.ok) {
        throw new Error('Failed to fetch from IPFS');
      }
      const arrayBuffer = await ipfsResponse.arrayBuffer();
      encryptedBuffer = Buffer.from(arrayBuffer);
    } else {
      // Fetch from Supabase Storage
      const { data: fileData, error: storageError } = await supabaseAdmin.storage
        .from('kyc-documents')
        .download(document.file_path);
      
      if (storageError || !fileData) {
        throw new Error('Failed to fetch from storage');
      }
      
      encryptedBuffer = Buffer.from(await fileData.arrayBuffer());
    }

    // Decrypt document
    const decryptedBuffer = DocumentEncryptionService.decryptDocument({
      encrypted: encryptedBuffer,
      iv: document.encryption_iv,
      authTag: document.encryption_auth_tag,
      salt: document.encryption_salt
    });

    // Log download
    await supabaseAdmin
      .from('audit_logs_enhanced')
      .insert({
        user_id: decoded.userId,
        action: 'kyc_document_downloaded',
        resource_type: 'kyc_documents',
        resource_id: documentId,
        details: {
          document_type: document.document_type,
          file_name: document.file_name
        },
        severity: 'info',
        created_at: new Date().toISOString()
      });

    // Return decrypted file
    return new NextResponse(decryptedBuffer, {
      headers: {
        'Content-Type': document.file_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${document.file_name}"`,
        'Content-Length': decryptedBuffer.length.toString()
      }
    });

  } catch (error) {
    logError('KYC Document Download', error as Error);
    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    );
  }
}
