/**
 * Document Integrity Service
 * Handles document hash generation and blockchain verification
 */

import { EncryptionService } from './encryption';
import { supabaseAdmin } from '@/lib/supabase/client';

export interface DocumentHashRecord {
  documentId: string;
  fileHash: string;
  blockchainTxHash?: string;
  blockchainVerified: boolean;
  timestamp: string;
}

export class DocumentIntegrityService {
  
  /**
   * Generate and store document hash
   */
  static async processDocument(
    fileBuffer: Buffer,
    documentId: string,
    userId: string
  ): Promise<DocumentHashRecord> {
    
    // Generate SHA-256 hash
    const fileHash = EncryptionService.generateHash(fileBuffer);
    
    // Store hash in database
    const record: DocumentHashRecord = {
      documentId,
      fileHash,
      blockchainVerified: false,
      timestamp: new Date().toISOString()
    };
    
    // Update document with hash
    await supabaseAdmin
      .from('kyc_documents')
      .update({ file_hash: fileHash })
      .eq('id', documentId);
    
    // Queue for blockchain storage (async)
    this.queueBlockchainStorage(documentId, fileHash, userId).catch(err => {
      console.error('Blockchain storage queue error:', err);
    });
    
    return record;
  }
  
  /**
   * Queue document hash for blockchain storage
   */
  private static async queueBlockchainStorage(
    documentId: string,
    fileHash: string,
    userId: string
  ): Promise<void> {
    
    // Add to blockchain sync queue
    await supabaseAdmin
      .from('blockchain_sync_log')
      .insert({
        entity_type: 'kyc_document',
        entity_id: documentId,
        action: 'store_hash',
        data_hash: fileHash,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    
    // In production, this would trigger a background job
    // For now, we'll simulate blockchain storage
    console.log(`📝 Queued for blockchain: ${fileHash}`);
  }
  
  /**
   * Verify document integrity
   */
  static async verifyDocument(
    fileBuffer: Buffer,
    storedHash: string
  ): Promise<{
    isValid: boolean;
    computedHash: string;
    storedHash: string;
  }> {
    
    const computedHash = EncryptionService.generateHash(fileBuffer);
    
    return {
      isValid: computedHash === storedHash,
      computedHash,
      storedHash
    };
  }
  
  /**
   * Get document verification status
   */
  static async getVerificationStatus(
    documentId: string
  ): Promise<{
    hasHash: boolean;
    blockchainVerified: boolean;
    txHash?: string;
  }> {
    
    const { data: doc } = await supabaseAdmin
      .from('kyc_documents')
      .select('file_hash, blockchain_tx_hash, blockchain_verified')
      .eq('id', documentId)
      .single();
    
    if (!doc) {
      return {
        hasHash: false,
        blockchainVerified: false
      };
    }
    
    return {
      hasHash: !!doc.file_hash,
      blockchainVerified: doc.blockchain_verified || false,
      txHash: doc.blockchain_tx_hash
    };
  }
  
  /**
   * Mark document as blockchain verified
   */
  static async markBlockchainVerified(
    documentId: string,
    txHash: string
  ): Promise<void> {
    
    await supabaseAdmin
      .from('kyc_documents')
      .update({
        blockchain_tx_hash: txHash,
        blockchain_verified: true
      })
      .eq('id', documentId);
    
    // Update sync log
    await supabaseAdmin
      .from('blockchain_sync_log')
      .update({
        tx_hash: txHash,
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      })
      .eq('entity_id', documentId)
      .eq('status', 'pending');
  }
}

export default DocumentIntegrityService;
