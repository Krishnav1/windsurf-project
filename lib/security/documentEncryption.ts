/**
 * Document Encryption Service
 * AES-256-GCM encryption for KYC documents
 * IFSCA & GDPR Compliant
 */

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

export interface EncryptionResult {
  encrypted: Buffer;
  iv: string;
  authTag: string;
  salt: string;
}

export interface DecryptionParams {
  encrypted: Buffer;
  iv: string;
  authTag: string;
  salt: string;
}

export class DocumentEncryptionService {
  
  /**
   * Derive encryption key from master key + salt
   */
  private static deriveKey(salt: Buffer): Buffer {
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
      throw new Error('ENCRYPTION_KEY not configured or too short');
    }

    return crypto.pbkdf2Sync(
      ENCRYPTION_KEY,
      salt,
      100000, // iterations
      32, // key length
      'sha256'
    );
  }

  /**
   * Encrypt document buffer with AES-256-GCM
   */
  static encryptDocument(documentBuffer: Buffer): EncryptionResult {
    try {
      // Generate random salt and IV
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);

      // Derive encryption key
      const key = this.deriveKey(salt);

      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

      // Encrypt
      const encrypted = Buffer.concat([
        cipher.update(documentBuffer),
        cipher.final()
      ]);

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        salt: salt.toString('hex')
      };

    } catch (error: any) {
      console.error('Encryption error:', error);
      throw new Error(`Document encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt document buffer
   */
  static decryptDocument(params: DecryptionParams): Buffer {
    try {
      // Convert hex strings back to buffers
      const iv = Buffer.from(params.iv, 'hex');
      const authTag = Buffer.from(params.authTag, 'hex');
      const salt = Buffer.from(params.salt, 'hex');

      // Derive same encryption key
      const key = this.deriveKey(salt);

      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(params.encrypted),
        decipher.final()
      ]);

      return decrypted;

    } catch (error: any) {
      console.error('Decryption error:', error);
      throw new Error(`Document decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt text data (for storing encryption metadata)
   */
  static encryptText(text: string): { encrypted: string; iv: string } {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf-8');
      
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return {
        encrypted,
        iv: iv.toString('hex')
      };

    } catch (error: any) {
      console.error('Text encryption error:', error);
      throw new Error(`Text encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt text data
   */
  static decryptText(encrypted: string, iv: string): string {
    try {
      const ivBuffer = Buffer.from(iv, 'hex');
      const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf-8');
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;

    } catch (error: any) {
      console.error('Text decryption error:', error);
      throw new Error(`Text decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate document hash (for integrity verification)
   */
  static generateHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Verify document integrity
   */
  static verifyHash(buffer: Buffer, expectedHash: string): boolean {
    const actualHash = this.generateHash(buffer);
    return actualHash === expectedHash;
  }
}
