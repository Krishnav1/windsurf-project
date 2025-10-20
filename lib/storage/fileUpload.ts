/**
 * File Upload Service
 * Handles secure file uploads to Supabase Storage
 */

import { supabaseAdmin } from '@/lib/supabase/client';
import { EncryptionService } from '@/lib/security/encryption';
import { DocumentIntegrityService } from '@/lib/security/documentIntegrity';
import { DocumentEncryptionService } from '@/lib/security/documentEncryption';
import { PinataService } from '@/lib/ipfs/pinataService';
import { uploadWithPublicUrl } from '@/lib/storage/storageService';
import { logError } from '@/lib/utils/errorHandler';
import { processDocumentWithRetry } from '@/lib/blockchain/retryService';

export interface UploadResult {
  fileUrl: string;
  fileHash: string;
  fileName: string;
  fileSize: number;
  documentId: string;
  ipfsHash?: string;
  ipfsUrl?: string;
}

export class FileUploadService {
  
  /**
   * Upload KYC document with encryption + IPFS (IFSCA Compliant)
   */
  static async uploadKYCDocument(
    file: File,
    userId: string,
    documentType: string
  ): Promise<UploadResult> {
    
    // Validate file
    this.validateFile(file);
    
    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    
    // Generate hash of original file (before encryption)
    const fileHash = DocumentEncryptionService.generateHash(fileBuffer);
    
    console.log(`[KYC Upload] Step 1: File validated - ${file.name} (${file.size} bytes)`);
    
    // STEP 1: Encrypt document with AES-256-GCM
    let encryptionResult;
    try {
      encryptionResult = DocumentEncryptionService.encryptDocument(fileBuffer);
      console.log('[KYC Upload] Step 2: Document encrypted successfully');
    } catch (error) {
      logError('Document Encryption Failed', error as Error, { userId, documentType });
      throw new Error('Failed to encrypt document');
    }
    
    // STEP 2: Upload encrypted document to IPFS via Pinata
    let ipfsResult;
    try {
      ipfsResult = await PinataService.uploadEncryptedDocument(
        encryptionResult.encrypted,
        userId,
        documentType,
        file.name
      );
      console.log('[KYC Upload] Step 3: Uploaded to IPFS:', ipfsResult.ipfsHash);
    } catch (error) {
      logError('IPFS Upload Failed', error as Error, { userId, documentType });
      throw new Error('Failed to upload to IPFS');
    }
    
    // STEP 3: Also upload to Supabase Storage as backup (encrypted)
    const uniqueId = crypto.randomUUID();
    const lastDotIndex = file.name.lastIndexOf('.');
    const fileExt = lastDotIndex > 0 ? file.name.substring(lastDotIndex + 1) : '';
    const fileName = fileExt
      ? `${userId}/${documentType}_${uniqueId}.enc.${fileExt}`
      : `${userId}/${documentType}_${uniqueId}.enc`;
    
    let publicUrl: string = '';
    let filePath: string = '';
    
    try {
      // Create a File object from encrypted buffer
      const encryptedFile = new File(
        [encryptionResult.encrypted],
        `${file.name}.encrypted`,
        { type: 'application/octet-stream' }
      );
      
      const uploadResult = await uploadWithPublicUrl(
        'kyc-documents',
        fileName,
        encryptedFile,
        { cacheControl: '3600', upsert: false }
      );
      publicUrl = uploadResult.publicUrl;
      filePath = uploadResult.filePath;
      console.log('[KYC Upload] Step 4: Backup uploaded to Supabase Storage');
    } catch (uploadError) {
      // Non-critical - IPFS is primary storage
      logError('Supabase Backup Upload Failed', uploadError as Error, { userId, documentType });
      console.warn('[KYC Upload] Supabase backup failed, continuing with IPFS only');
    }
    
    // STEP 4: Create database record with encryption metadata
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }
    
    const { data: docRecord, error: dbError } = await supabaseAdmin
      .from('kyc_documents')
      .insert({
        user_id: userId,
        document_type: documentType,
        file_url: publicUrl || ipfsResult.pinataUrl, // Use IPFS URL if Supabase failed
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_hash: fileHash,
        ipfs_hash: ipfsResult.ipfsHash,
        ipfs_url: ipfsResult.ipfsUrl,
        encryption_iv: encryptionResult.iv,
        encryption_auth_tag: encryptionResult.authTag,
        encryption_salt: encryptionResult.salt,
        encrypted: true,
        status: 'pending',
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (dbError) {
      // Rollback: Delete from IPFS and Supabase
      try {
        await PinataService.unpinFile(ipfsResult.ipfsHash);
        if (filePath) {
          await supabaseAdmin.storage
            .from('kyc-documents')
            .remove([filePath]);
        }
      } catch (cleanupError) {
        logError('Cleanup Failed', cleanupError as Error, { userId, documentType });
      }
      throw new Error(`Database error: ${dbError.message}`);
    }
    
    console.log('[KYC Upload] Step 5: Database record created:', docRecord.id);
    
    // STEP 5: Log to audit trail
    try {
      await supabaseAdmin
        .from('audit_logs_enhanced')
        .insert({
          user_id: userId,
          action: 'kyc_document_uploaded_encrypted',
          resource_type: 'kyc_documents',
          resource_id: docRecord.id,
          details: {
            documentType,
            fileName: file.name,
            fileSize: file.size,
            ipfsHash: ipfsResult.ipfsHash,
            encrypted: true,
            storage: 'ipfs+supabase'
          },
          severity: 'info',
          created_at: new Date().toISOString()
        });
    } catch (auditError) {
      logError('Audit Log Failed', auditError as Error, { userId, documentType });
    }
    
    console.log('[KYC Upload] ✅ Complete - Document encrypted and stored on IPFS');
    
    return {
      fileUrl: ipfsResult.pinataUrl,
      fileHash,
      fileName: file.name,
      fileSize: file.size,
      documentId: docRecord.id,
      ipfsHash: ipfsResult.ipfsHash,
      ipfsUrl: ipfsResult.ipfsUrl
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
