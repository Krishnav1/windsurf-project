/**
 * Pinata IPFS Service
 * Handles encrypted document uploads to IPFS via Pinata
 * IFSCA Compliant - Decentralized storage with encryption
 */

import pinataSDK from '@pinata/sdk';
import { Readable } from 'stream';

const PINATA_API_KEY = process.env.PINATA_API_KEY || '';
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || '';

// Initialize Pinata
const pinata = new pinataSDK(PINATA_API_KEY, PINATA_SECRET_KEY);

export interface IPFSUploadResult {
  ipfsHash: string;
  ipfsUrl: string;
  pinataUrl: string;
  timestamp: string;
}

export interface PinataMetadata {
  name: string;
  keyvalues: {
    userId: string;
    documentType: string;
    encrypted: string;
    uploadedAt: string;
    [key: string]: string;
  };
}

export class PinataService {
  
  /**
   * Test Pinata connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      await pinata.testAuthentication();
      return true;
    } catch (error) {
      console.error('Pinata authentication failed:', error);
      return false;
    }
  }

  /**
   * Upload encrypted buffer to IPFS via Pinata
   */
  static async uploadEncryptedDocument(
    encryptedBuffer: Buffer,
    userId: string,
    documentType: string,
    originalFileName: string
  ): Promise<IPFSUploadResult> {
    
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      throw new Error('Pinata credentials not configured');
    }

    try {
      // Create readable stream from buffer
      const stream = Readable.from(encryptedBuffer);

      // Prepare metadata
      const metadata: PinataMetadata = {
        name: `${documentType}_${userId}_${Date.now()}`,
        keyvalues: {
          userId,
          documentType,
          encrypted: 'true',
          uploadedAt: new Date().toISOString()
        }
      };

      // Upload to IPFS
      const result = await pinata.pinFileToIPFS(stream, {
        pinataMetadata: metadata,
        pinataOptions: {
          cidVersion: 1
        }
      });

      const ipfsHash = result.IpfsHash;
      const timestamp = result.Timestamp;

      return {
        ipfsHash,
        ipfsUrl: `ipfs://${ipfsHash}`,
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        timestamp
      };

    } catch (error: any) {
      console.error('Pinata upload error:', error);
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  /**
   * Upload JSON metadata to IPFS
   */
  static async uploadJSON(
    jsonData: any,
    name: string
  ): Promise<IPFSUploadResult> {
    
    try {
      const result = await pinata.pinJSONToIPFS(jsonData, {
        pinataMetadata: {
          name
        }
      });

      const ipfsHash = result.IpfsHash;
      const timestamp = result.Timestamp;

      return {
        ipfsHash,
        ipfsUrl: `ipfs://${ipfsHash}`,
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        timestamp
      };

    } catch (error: any) {
      console.error('Pinata JSON upload error:', error);
      throw new Error(`IPFS JSON upload failed: ${error.message}`);
    }
  }

  /**
   * Unpin file from IPFS (delete)
   */
  static async unpinFile(ipfsHash: string): Promise<void> {
    try {
      await pinata.unpin(ipfsHash);
    } catch (error: any) {
      console.error('Pinata unpin error:', error);
      throw new Error(`Failed to unpin from IPFS: ${error.message}`);
    }
  }

  /**
   * Get pinned files list
   */
  static async listPinnedFiles(userId?: string): Promise<any[]> {
    try {
      const filters: any = {
        status: 'pinned'
      };

      if (userId) {
        filters.metadata = {
          keyvalues: {
            userId: {
              value: userId,
              op: 'eq'
            }
          }
        };
      }

      const result = await pinata.pinList(filters);
      return result.rows;

    } catch (error: any) {
      console.error('Pinata list error:', error);
      throw new Error(`Failed to list pinned files: ${error.message}`);
    }
  }

  /**
   * Get file metadata from IPFS
   */
  static async getFileMetadata(ipfsHash: string): Promise<any> {
    try {
      const result = await pinata.pinList({
        hashContains: ipfsHash
      });

      if (result.rows.length === 0) {
        throw new Error('File not found on IPFS');
      }

      return result.rows[0];

    } catch (error: any) {
      console.error('Pinata metadata error:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }
}
