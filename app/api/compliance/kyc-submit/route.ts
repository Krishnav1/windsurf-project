/**
 * KYC Document Upload API
 * Handles file uploads with encryption and blockchain integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';
import { FileUploadService } from '@/lib/storage/fileUpload';
import { sanitizeError, logError } from '@/lib/utils/errorHandler';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;
  
  try {
    console.log('[KYC Submit API] Starting upload process...');
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      console.error('[KYC Submit API] No authorization token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.error('[KYC Submit API] Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    userId = decoded.userId;
    console.log(`[KYC Submit API] User authenticated: ${userId}`);

    const formData = await request.formData();
    const uploadedDocs = [];
    const uploadErrors: string[] = [];

    // Document types mapping
    const docTypes: Record<string, string> = {
      idProof: 'aadhaar',
      addressProof: 'address_proof',
      panCard: 'pan',
      photo: 'photo'
    };

    console.log(`[KYC Submit API] Processing ${Object.keys(docTypes).length} document types...`);

    // Upload each document
    for (const [key, docType] of Object.entries(docTypes)) {
      const file = formData.get(key) as File | null;
      if (file) {
        console.log(`[KYC Submit API] Uploading ${docType}: ${file.name} (${file.size} bytes)`);
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
          console.log(`[KYC Submit API] ✓ ${docType} uploaded successfully - Document ID: ${result.documentId}`);
        } catch (error) {
          const errorMsg = `Failed to upload ${docType}: ${(error as Error).message}`;
          console.error(`[KYC Submit API] ✗ ${errorMsg}`);
          uploadErrors.push(errorMsg);
          logError(`Document Upload (${docType})`, error as Error, { userId: decoded.userId });
          
          // Return detailed error for first failed upload
          return NextResponse.json(
            { 
              success: false,
              error: errorMsg,
              details: (error as Error).message 
            },
            { status: 500 }
          );
        }
      } else {
        console.log(`[KYC Submit API] No file provided for ${docType}`);
      }
    }

    if (uploadedDocs.length === 0) {
      console.error('[KYC Submit API] No documents were uploaded');
      return NextResponse.json(
        { error: 'No documents provided' },
        { status: 400 }
      );
    }

    console.log(`[KYC Submit API] Successfully uploaded ${uploadedDocs.length} documents`);

    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // Update user KYC status to pending
    console.log('[KYC Submit API] Updating user KYC status to pending...');
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        kyc_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', decoded.userId);

    if (updateError) {
      console.error('[KYC Submit API] Failed to update user status:', updateError);
      throw new Error(`Failed to update KYC status: ${updateError.message}`);
    }
    console.log('[KYC Submit API] ✓ User KYC status updated');

    // Create notification for user
    console.log('[KYC Submit API] Creating notification...');
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: decoded.userId,
        type: 'kyc_submitted',
        title: 'KYC Documents Submitted',
        message: `You have submitted ${uploadedDocs.length} KYC documents for verification. Our team will review them within 24-48 hours.`,
        priority: 'normal',
        created_at: new Date().toISOString()
      });

    if (notificationError) {
      console.warn('[KYC Submit API] Notification creation failed (non-critical):', notificationError);
      logError('KYC Submit Notification', notificationError, { userId: decoded.userId });
    } else {
      console.log('[KYC Submit API] ✓ Notification created');
    }

    // Log audit
    console.log('[KYC Submit API] Creating audit log...');
    const { error: auditError } = await supabaseAdmin
      .from('audit_logs_enhanced')
      .insert({
        user_id: decoded.userId,
        action: 'kyc_documents_uploaded',
        resource_type: 'kyc_documents',
        details: {
          documentCount: uploadedDocs.length,
          documentTypes: uploadedDocs.map(d => d.type),
          ipfsHashes: uploadedDocs.map(d => d.ipfsHash),
          uploadDuration: Date.now() - startTime
        },
        severity: 'info',
        created_at: new Date().toISOString()
      });
    
    if (auditError) {
      console.warn('[KYC Submit API] Audit log creation failed (non-critical):', auditError);
      logError('KYC Submit Audit', auditError, { userId: decoded.userId });
    } else {
      console.log('[KYC Submit API] ✓ Audit log created');
    }

    const duration = Date.now() - startTime;
    console.log(`[KYC Submit API] ✅ Upload complete in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'KYC documents uploaded successfully',
      documents: uploadedDocs,
      uploadedCount: uploadedDocs.length,
      duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[KYC Submit API] ✗ Upload failed after ${duration}ms:`, error);
    logError('KYC Submit', error as Error, { userId });
    return NextResponse.json(
      { 
        success: false,
        error: sanitizeError(error as Error),
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}
