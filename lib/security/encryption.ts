/**
 * Encryption Service
 * AES-256-GCM encryption for sensitive data
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16;

// Get encryption key from environment or generate one
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(KEY_LENGTH).toString('hex');

if (!process.env.ENCRYPTION_KEY) {
  console.warn('⚠️ ENCRYPTION_KEY not set in environment. Using temporary key. Set in production!');
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

export class EncryptionService {
  
  /**
   * Encrypt sensitive data
   */
  static encrypt(plaintext: string): EncryptedData {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const key = Buffer.from(ENCRYPTION_KEY, 'hex');
      
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }
  
  /**
   * Decrypt encrypted data
   */
  static decrypt(encryptedData: EncryptedData): string {
    try {
      const key = Buffer.from(ENCRYPTION_KEY, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');
      
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }
  
  /**
   * Generate SHA-256 hash
   */
  static generateHash(data: string | Buffer): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }
  
  /**
   * Generate document hash from file buffer
   */
  static async generateFileHash(fileBuffer: Buffer): Promise<string> {
    return this.generateHash(fileBuffer);
  }
  
  /**
   * Verify hash matches data
   */
  static verifyHash(data: string | Buffer, hash: string): boolean {
    const computedHash = this.generateHash(data);
    return computedHash === hash;
  }
  
  /**
   * Generate random token
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

export default EncryptionService;
