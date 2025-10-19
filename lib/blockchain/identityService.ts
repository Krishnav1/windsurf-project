/**
 * Identity Registry Service
 * Handles blockchain identity registration for KYC-approved users
 */

import { BrowserProvider, Contract, keccak256, toUtf8Bytes } from 'ethers';

// Window ethereum type declaration
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Placeholder ABI - will be replaced after deployment
const IDENTITY_REGISTRY_ABI = [
  "function registerIdentity(address wallet, bytes32 identityHash, uint256 kycExpiry)",
  "function isVerified(address wallet) view returns (bool)",
  "function getIdentity(address wallet) view returns (tuple(bool verified, uint256 kycExpiry, bytes32 identityHash))",
  "function revokeIdentity(address wallet)",
  "function updateIdentity(address wallet, bytes32 identityHash, uint256 kycExpiry)"
];

const IDENTITY_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_ADDRESS || '';

export interface IdentityRecord {
  verified: boolean;
  kycExpiry: Date;
  identityHash: string;
}

class IdentityService {
  private provider: BrowserProvider | null = null;
  private contract: Contract | null = null;

  /**
   * Initialize the service
   */
  async initialize() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    this.provider = new BrowserProvider(window.ethereum);
    
    if (!IDENTITY_REGISTRY_ADDRESS) {
      throw new Error('Identity Registry address not configured');
    }

    this.contract = new Contract(
      IDENTITY_REGISTRY_ADDRESS,
      IDENTITY_REGISTRY_ABI,
      this.provider
    );
  }

  /**
   * Create identity hash from user data
   * Hash = keccak256(PAN + Aadhaar + timestamp)
   */
  static createIdentityHash(pan: string, aadhaar: string, timestamp: number): string {
    const data = `${pan}-${aadhaar}-${timestamp}`;
    return keccak256(toUtf8Bytes(data));
  }

  /**
   * Register identity on blockchain (Admin only)
   */
  async registerIdentity(
    walletAddress: string,
    identityHash: string,
    kycExpiryDate: Date
  ): Promise<string> {
    try {
      if (!this.contract) await this.initialize();

      const signer = await this.provider!.getSigner();
      const contractWithSigner = this.contract!.connect(signer);

      // Convert expiry date to Unix timestamp
      const kycExpiry = Math.floor(kycExpiryDate.getTime() / 1000);

      const tx = await contractWithSigner.registerIdentity(
        walletAddress,
        identityHash,
        kycExpiry
      );

      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error('Register identity error:', error);
      throw new Error(error.message || 'Failed to register identity on blockchain');
    }
  }

  /**
   * Check if address is verified on blockchain
   */
  async isVerified(walletAddress: string): Promise<boolean> {
    try {
      if (!this.contract) await this.initialize();
      return await this.contract!.isVerified(walletAddress);
    } catch (error) {
      console.error('Error checking verification:', error);
      return false;
    }
  }

  /**
   * Get identity record from blockchain
   */
  async getIdentity(walletAddress: string): Promise<IdentityRecord | null> {
    try {
      if (!this.contract) await this.initialize();
      
      const identity = await this.contract!.getIdentity(walletAddress);
      
      if (!identity.verified) {
        return null;
      }

      return {
        verified: identity.verified,
        kycExpiry: new Date(Number(identity.kycExpiry) * 1000),
        identityHash: identity.identityHash
      };
    } catch (error) {
      console.error('Error getting identity:', error);
      return null;
    }
  }

  /**
   * Revoke identity on blockchain (Admin only)
   */
  async revokeIdentity(walletAddress: string): Promise<string> {
    try {
      if (!this.contract) await this.initialize();

      const signer = await this.provider!.getSigner();
      const contractWithSigner = this.contract!.connect(signer);

      const tx = await contractWithSigner.revokeIdentity(walletAddress);
      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error('Revoke identity error:', error);
      throw new Error(error.message || 'Failed to revoke identity');
    }
  }

  /**
   * Update identity on blockchain (Admin only)
   */
  async updateIdentity(
    walletAddress: string,
    identityHash: string,
    kycExpiryDate: Date
  ): Promise<string> {
    try {
      if (!this.contract) await this.initialize();

      const signer = await this.provider!.getSigner();
      const contractWithSigner = this.contract!.connect(signer);

      const kycExpiry = Math.floor(kycExpiryDate.getTime() / 1000);

      const tx = await contractWithSigner.updateIdentity(
        walletAddress,
        identityHash,
        kycExpiry
      );

      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error('Update identity error:', error);
      throw new Error(error.message || 'Failed to update identity');
    }
  }
}

// Export singleton instance
export const identityService = new IdentityService();

// Export helper functions
export async function registerIdentityOnChain(
  walletAddress: string,
  pan: string,
  aadhaar: string,
  kycExpiryDate: Date
): Promise<string> {
  const timestamp = Date.now();
  const identityHash = IdentityService.createIdentityHash(pan, aadhaar, timestamp);
  return identityService.registerIdentity(walletAddress, identityHash, kycExpiryDate);
}

export async function isIdentityVerified(walletAddress: string): Promise<boolean> {
  return identityService.isVerified(walletAddress);
}

export async function getIdentityRecord(walletAddress: string): Promise<IdentityRecord | null> {
  return identityService.getIdentity(walletAddress);
}
