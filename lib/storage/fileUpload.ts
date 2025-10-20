/**
 * File Upload Service
 * Handles secure file uploads to Supabase Storage
 */

import { supabaseAdmin } from '@/lib/supabase/client';
import { EncryptionService } from '@/lib/security/encryption';
import { DocumentIntegrityService } from '@/lib/security/documentIntegrity';

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
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${documentType}_${Date.now()}.${fileExt}`;
    
    // Convert to buffer for hashing
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    
    // Generate hash before upload
    const fileHash = EncryptionService.generateHash(fileBuffer);
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('kyc-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('kyc-documents')
      .getPublicUrl(fileName);
    
    // Create database record
    const { data: docRecord, error: dbError } = await supabaseAdmin
      .from('kyc_documents')
      .insert({
        user_id: userId,
        document_type: documentType,
        file_url: publicUrl,
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
      // Rollback storage upload
      await supabaseAdmin.storage
        .from('kyc-documents')
        .remove([fileName]);
      throw new Error(`Database error: ${dbError.message}`);
    }
    
    // Queue for blockchain storage
    await DocumentIntegrityService.processDocument(
      fileBuffer,
      docRecord.id,
      userId
    );
    
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
    
    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('issuer-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('issuer-documents')
      .getPublicUrl(fileName);
    
    // Create database record
    const { data: docRecord, error: dbError } = await supabaseAdmin
      .from('issuer_documents')
      .insert({
        token_id: tokenId,
        issuer_id: issuerId,
        document_type: documentType,
        document_category: documentCategory,
        file_url: publicUrl,
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
      await supabaseAdmin.storage
        .from('issuer-documents')
        .remove([fileName]);
      throw new Error(`Database error: ${dbError.message}`);
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
    
    // Get file path
    const { data: doc } = await supabaseAdmin
      .from(tableName)
      .select('file_url')
      .eq('id', documentId)
      .single();
    
    if (!doc) {
      throw new Error('Document not found');
    }
    
    // Extract file path from URL
    const urlParts = doc.file_url.split('/');
    const filePath = urlParts.slice(-3).join('/'); // user_id/document_type_timestamp.ext
    
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
