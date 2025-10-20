/**
 * File Upload Service
 * Handles secure file uploads to Supabase Storage
 */

import { supabaseAdmin } from '@/lib/supabase/client';
import { EncryptionService } from '@/lib/security/encryption';
import { DocumentIntegrityService } from '@/lib/security/documentIntegrity';
import { uploadWithPublicUrl } from '@/lib/storage/storageService';
import { logError } from '@/lib/utils/errorHandler';
import { processDocumentWithRetry } from '@/lib/blockchain/retryService';

export interface UploadResult {
  fileUrl: string;
  fileHash: string;
  fileName: string;
  fileSize: number;
  documentId: string;
}

export class FileUploadService {
  
  /**
   * Upload KYC document
   */
  static async uploadKYCDocument(
    file: File,
    userId: string,
    documentType: string
  ): Promise<UploadResult> {
    
    // Validate file
    this.validateFile(file);
    
    // Generate unique filename with proper extension handling
    const lastDotIndex = file.name.lastIndexOf('.');
    const fileExt = lastDotIndex > 0 ? file.name.substring(lastDotIndex + 1) : '';
    const uniqueId = crypto.randomUUID();
    const fileName = fileExt
      ? `${userId}/${documentType}_${uniqueId}.${fileExt}`
      : `${userId}/${documentType}_${uniqueId}`;
    
    // Convert to buffer for hashing
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    
    // Generate hash before upload
    const fileHash = EncryptionService.generateHash(fileBuffer);
    
    // Upload to Supabase Storage and get public URL with error handling
    let publicUrl: string;
    let filePath: string;
    
    try {
      const uploadResult = await uploadWithPublicUrl(
        'kyc-documents',
        fileName,
        file,
        { cacheControl: '3600', upsert: false }
      );
      publicUrl = uploadResult.publicUrl;
      filePath = uploadResult.filePath;
    } catch (uploadError) {
      throw new Error(`File upload failed: ${(uploadError as Error).message}`);
    }
    
    // Create database record with file_path for easier deletion
    const { data: docRecord, error: dbError } = await supabaseAdmin
      .from('kyc_documents')
      .insert({
        user_id: userId,
        document_type: documentType,
        file_url: publicUrl,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_hash: fileHash,
        status: 'pending',
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (dbError) {
      // Rollback: Delete uploaded file to prevent orphaned files
      try {
        await supabaseAdmin.storage
          .from('kyc-documents')
          .remove([filePath]);
      } catch (cleanupError) {
        logError('File Cleanup Failed', cleanupError as Error, { filePath, userId });
      }
      throw new Error(`Database error: ${dbError.message}`);
    }
    
    // Queue for blockchain storage with retry mechanism
    try {
      await processDocumentWithRetry(
        () => DocumentIntegrityService.processDocument(fileBuffer, docRecord.id, userId),
        docRecord.id,
        userId,
        { maxRetries: 3, initialDelay: 1000 }
      );
    } catch (error) {
      // Log error but don't fail the upload - document is already in DB
      logError('Blockchain Processing Failed', error as Error, { 
        documentId: docRecord.id, 
        userId,
        note: 'Document saved but blockchain storage failed after retries'
      });
    }
    
    return {
      fileUrl: publicUrl,
      fileHash,
      fileName: file.name,
      fileSize: file.size,
      documentId: docRecord.id
    };
  }
  
  /**
   * Upload issuer document
   */
  static async uploadIssuerDocument(
    file: File,
    tokenId: string,
    issuerId: string,
    documentType: string,
    documentCategory: string
  ): Promise<UploadResult> {
    
    this.validateFile(file);
    
    const lastDotIndex = file.name.lastIndexOf('.');
    const fileExt = lastDotIndex > 0 ? file.name.substring(lastDotIndex + 1) : '';
    const uniqueId = crypto.randomUUID();
    const fileName = fileExt
      ? `issuer/${tokenId}/${documentType}_${uniqueId}.${fileExt}`
      : `issuer/${tokenId}/${documentType}_${uniqueId}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const fileHash = EncryptionService.generateHash(fileBuffer);
    
    // Upload to storage and get public URL with error handling
    let publicUrl: string;
    let filePath: string;
    
    try {
      const uploadResult = await uploadWithPublicUrl(
        'issuer-documents',
        fileName,
        file,
        { cacheControl: '3600', upsert: false }
      );
      publicUrl = uploadResult.publicUrl;
      filePath = uploadResult.filePath;
    } catch (uploadError) {
      throw new Error(`File upload failed: ${(uploadError as Error).message}`);
    }
    
    // Create database record with file_path for easier deletion
    const { data: docRecord, error: dbError } = await supabaseAdmin
      .from('issuer_documents')
      .insert({
        token_id: tokenId,
        issuer_id: issuerId,
        document_type: documentType,
        document_category: documentCategory,
        file_url: publicUrl,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_hash: fileHash,
        status: 'pending',
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (dbError) {
      // Rollback: Delete uploaded file to prevent orphaned files
      try {
        await supabaseAdmin.storage
          .from('issuer-documents')
          .remove([filePath]);
      } catch (cleanupError) {
        logError('File Cleanup Failed', cleanupError as Error, { filePath, issuerId });
      }
      throw new Error(`Database error: ${dbError.message}`);
    }
    
    // Queue for blockchain storage with retry mechanism (consistent with KYC documents)
    try {
      await processDocumentWithRetry(
        () => DocumentIntegrityService.processDocument(fileBuffer, docRecord.id, issuerId),
        docRecord.id,
        issuerId,
        { maxRetries: 3, initialDelay: 1000 }
      );
    } catch (error) {
      // Log error but don't fail the upload - document is already in DB
      logError('Blockchain Processing Failed (Issuer)', error as Error, { 
        documentId: docRecord.id, 
        issuerId,
        note: 'Document saved but blockchain storage failed after retries'
      });
    }
    
    return {
      fileUrl: publicUrl,
      fileHash,
      fileName: file.name,
      fileSize: file.size,
      documentId: docRecord.id
    };
  }
  
  /**
   * Validate file before upload
   */
  private static validateFile(file: File): void {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf'
    ];
    
    if (file.size > MAX_SIZE) {
      throw new Error('File size exceeds 5MB limit');
    }
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Only JPG, PNG, and PDF allowed');
    }
  }
  
  /**
   * Get signed URL for secure download
   */
  static async getSignedUrl(
    bucket: 'kyc-documents' | 'issuer-documents',
    filePath: string,
    expiresIn: number = 3600
  ): Promise<string> {
    
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);
    
    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
    
    return data.signedUrl;
  }
  
  /**
   * Delete document
   */
  static async deleteDocument(
    documentId: string,
    bucket: 'kyc-documents' | 'issuer-documents',
    tableName: 'kyc_documents' | 'issuer_documents'
  ): Promise<void> {
    
    // Get file path from database (more reliable than parsing URL)
    const { data: doc, error: fetchError } = await supabaseAdmin
      .from(tableName)
      .select('file_path, file_url')
      .eq('id', documentId)
      .single();
    
    if (fetchError || !doc) {
      throw new Error('Document not found');
    }
    
    // Use stored file_path if available, otherwise extract from URL
    let filePath = doc.file_path;
    if (!filePath) {
      // Fallback: extract from URL (for old records without file_path)
      const url = new URL(doc.file_url);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.indexOf(bucket);
      if (bucketIndex === -1) {
        throw new Error('Invalid file URL format');
      }
      filePath = pathParts.slice(bucketIndex + 1).join('/');
    }
    
    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from(bucket)
      .remove([filePath]);
    
    if (storageError) {
      throw new Error(`Failed to delete file from storage: ${storageError.message}`);
    }
    
    // Delete from database
    const { error: dbError } = await supabaseAdmin
      .from(tableName)
      .delete()
      .eq('id', documentId);
    
    if (dbError) {
      throw new Error(`Failed to delete database record: ${dbError.message}`);
    }
  }
}

export default FileUploadService;
