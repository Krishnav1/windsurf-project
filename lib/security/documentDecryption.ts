/**
 * Document Decryption Service (Client-Side)
 * Decrypts AES-256-GCM encrypted documents for viewing/download
 */

export class DocumentDecryptionService {
  
  /**
   * Decrypt document buffer using encryption metadata
   */
  static async decryptDocument(
    encryptedBuffer: ArrayBuffer,
    iv: string,
    authTag: string,
    salt: string
  ): Promise<ArrayBuffer> {
    
    try {
      // Get encryption key from environment (should be securely managed)
      const keyMaterial = await this.getKeyMaterial();
      
      // Derive key using salt
      const key = await this.deriveKey(keyMaterial, salt);
      
      // Combine encrypted data with auth tag
      const ivBuffer = this.base64ToBuffer(iv);
      const authTagBuffer = this.base64ToBuffer(authTag);
      const encryptedData = new Uint8Array(encryptedBuffer);
      
      // Concatenate encrypted data and auth tag
      const authTagArray = new Uint8Array(authTagBuffer);
      const combined = new Uint8Array(encryptedData.length + authTagArray.length);
      combined.set(encryptedData);
      combined.set(authTagArray, encryptedData.length);
      
      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBuffer,
          tagLength: 128
        },
        key,
        combined
      );
      
      return decrypted;
      
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt document');
    }
  }
  
  /**
   * Get key material from password/secret
   */
  private static async getKeyMaterial(): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-key-change-in-production');
    
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
  }
  
  /**
   * Derive encryption key using PBKDF2
   */
  private static async deriveKey(
    keyMaterial: CryptoKey,
    salt: string
  ): Promise<CryptoKey> {
    
    const saltBuffer = this.base64ToBuffer(salt);
    
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
  }
  
  /**
   * Convert base64 string to ArrayBuffer
   */
  private static base64ToBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  /**
   * Create download link for decrypted file
   */
  static createDownloadLink(
    decryptedData: ArrayBuffer,
    fileName: string,
    mimeType: string
  ): string {
    const blob = new Blob([decryptedData], { type: mimeType });
    return URL.createObjectURL(blob);
  }
  
  /**
   * Trigger file download
   */
  static downloadFile(url: string, fileName: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
