/**
 * KYC Document Upload API
 * Handles file uploads with encryption and blockchain integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';
import { FileUploadService } from '@/lib/storage/fileUpload';

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

    const formData = await request.formData();
    const uploadedDocs = [];

    // Document types mapping
    const docTypes: Record<string, string> = {
      idProof: 'aadhaar',
      addressProof: 'address_proof',
      panCard: 'pan',
      photo: 'photo'
    };

    // Upload each document
    for (const [key, docType] of Object.entries(docTypes)) {
      const file = formData.get(key) as File | null;
      if (file) {
        try {
          const result = await FileUploadService.uploadKYCDocument(
            file,
            decoded.userId,
            docType
          );
          uploadedDocs.push({
            type: docType,
            ...result
          });
        } catch (error: any) {
          console.error(`Error uploading ${docType}:`, error);
          return NextResponse.json(
            { error: `Failed to upload ${docType}: ${error.message}` },
            { status: 500 }
          );
        }
      }
    }

    if (uploadedDocs.length === 0) {
      return NextResponse.json(
        { error: 'No documents provided' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // Update user KYC status to pending
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ kyc_status: 'pending' })
      .eq('id', decoded.userId);

    if (updateError) {
      throw new Error(`Failed to update KYC status: ${updateError.message}`);
    }

    // Create notification for admin
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: decoded.userId,
        type: 'kyc_submitted',
        title: 'KYC Documents Submitted',
        message: `You have submitted ${uploadedDocs.length} KYC documents for verification.`,
        priority: 'normal',
        created_at: new Date().toISOString()
      });

    // Log audit
    await supabaseAdmin
      .from('audit_logs_enhanced')
      .insert({
        user_id: decoded.userId,
        action: 'kyc_documents_uploaded',
        resource_type: 'kyc_documents',
        details: {
          documentCount: uploadedDocs.length,
          documentTypes: uploadedDocs.map(d => d.type)
        },
        severity: 'info',
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      message: 'KYC documents uploaded successfully',
      documents: uploadedDocs
    });

  } catch (error: any) {
    console.error('KYC submit error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
