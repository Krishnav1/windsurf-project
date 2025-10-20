/**
 * Blockchain KYC Registration Service
 * Server-side service to register KYC approvals on IdentityRegistry contract
 * IFSCA Compliant - On-chain verification
 */

import { ethers } from 'ethers';
import { supabaseAdmin } from '@/lib/supabase/client';

// Identity Registry ABI
const IDENTITY_REGISTRY_ABI = [
  "function registerIdentity(address wallet, bytes32 identityHash, uint256 kycExpiry) external",
  "function isVerified(address wallet) external view returns (bool)",
  "function getIdentity(address wallet) external view returns (tuple(bool verified, uint256 kycExpiry, bytes32 identityHash))",
  "function revokeIdentity(address wallet) external",
  "function updateIdentity(address wallet, bytes32 identityHash, uint256 kycExpiry) external",
  "function setOperator(address operator, bool active) external"
];

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc-amoy.polygon.technology';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || '';
const IDENTITY_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_ADDRESS || '';

export interface BlockchainRegistrationResult {
  txHash: string;
  identityHash: string;
  kycExpiry: number;
  blockNumber: number;
  gasUsed: string;
}

export class KYCRegistrationService {
  
  private static provider: ethers.JsonRpcProvider;
  private static wallet: ethers.Wallet;
  private static contract: ethers.Contract;

  /**
   * Initialize provider and contract
   */
  private static initialize() {
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(RPC_URL);
    }

    if (!this.wallet && DEPLOYER_PRIVATE_KEY) {
      this.wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, this.provider);
    }

    if (!this.contract && IDENTITY_REGISTRY_ADDRESS) {
      this.contract = new ethers.Contract(
        IDENTITY_REGISTRY_ADDRESS,
        IDENTITY_REGISTRY_ABI,
        this.wallet
      );
    }
  }

  /**
   * Create identity hash from IPFS hash + user data
   */
  static createIdentityHash(ipfsHash: string, userId: string): string {
    const data = `${ipfsHash}-${userId}-${Date.now()}`;
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }

  /**
   * Register KYC approval on blockchain
   */
  static async registerKYCOnChain(
    walletAddress: string,
    ipfsHash: string,
    userId: string,
    kycExpiryDate: Date
  ): Promise<BlockchainRegistrationResult> {
    
    try {
      this.initialize();

      if (!this.contract) {
        throw new Error('Identity Registry contract not configured');
      }

      if (!walletAddress || !ethers.isAddress(walletAddress)) {
        throw new Error('Invalid wallet address');
      }

      // Create identity hash
      const identityHash = this.createIdentityHash(ipfsHash, userId);

      // Convert expiry to Unix timestamp
      const kycExpiry = Math.floor(kycExpiryDate.getTime() / 1000);

      console.log('Registering identity on blockchain:', {
        walletAddress,
        identityHash,
        kycExpiry: new Date(kycExpiry * 1000).toISOString()
      });

      // Call smart contract
      const tx = await this.contract.registerIdentity(
        walletAddress,
        identityHash,
        kycExpiry
      );

      console.log('Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();

      console.log('Transaction confirmed:', {
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });

      return {
        txHash: receipt.hash,
        identityHash,
        kycExpiry,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error: any) {
      console.error('Blockchain registration error:', error);
      throw new Error(`Blockchain registration failed: ${error.message}`);
    }
  }

  /**
   * Check if wallet is verified on blockchain
   */
  static async isWalletVerified(walletAddress: string): Promise<boolean> {
    try {
      this.initialize();

      if (!this.contract) {
        throw new Error('Identity Registry contract not configured');
      }

      const isVerified = await this.contract.isVerified(walletAddress);
      return isVerified;

    } catch (error: any) {
      console.error('Verification check error:', error);
      return false;
    }
  }

  /**
   * Get identity record from blockchain
   */
  static async getIdentityFromChain(walletAddress: string): Promise<any> {
    try {
      this.initialize();

      if (!this.contract) {
        throw new Error('Identity Registry contract not configured');
      }

      const identity = await this.contract.getIdentity(walletAddress);
      
      return {
        verified: identity.verified,
        kycExpiry: new Date(Number(identity.kycExpiry) * 1000),
        identityHash: identity.identityHash
      };

    } catch (error: any) {
      console.error('Get identity error:', error);
      return null;
    }
  }

  /**
   * Revoke KYC on blockchain
   */
  static async revokeKYCOnChain(walletAddress: string): Promise<string> {
    try {
      this.initialize();

      if (!this.contract) {
        throw new Error('Identity Registry contract not configured');
      }

      const tx = await this.contract.revokeIdentity(walletAddress);
      const receipt = await tx.wait();

      console.log('KYC revoked on blockchain:', receipt.hash);

      return receipt.hash;

    } catch (error: any) {
      console.error('Revoke KYC error:', error);
      throw new Error(`Revoke KYC failed: ${error.message}`);
    }
  }

  /**
   * Update KYC on blockchain (for renewals)
   */
  static async updateKYCOnChain(
    walletAddress: string,
    ipfsHash: string,
    userId: string,
    kycExpiryDate: Date
  ): Promise<string> {
    try {
      this.initialize();

      if (!this.contract) {
        throw new Error('Identity Registry contract not configured');
      }

      const identityHash = this.createIdentityHash(ipfsHash, userId);
      const kycExpiry = Math.floor(kycExpiryDate.getTime() / 1000);

      const tx = await this.contract.updateIdentity(
        walletAddress,
        identityHash,
        kycExpiry
      );

      const receipt = await tx.wait();

      console.log('KYC updated on blockchain:', receipt.hash);

      return receipt.hash;

    } catch (error: any) {
      console.error('Update KYC error:', error);
      throw new Error(`Update KYC failed: ${error.message}`);
    }
  }

  /**
   * Log blockchain registration to database
   */
  static async logBlockchainRegistration(
    userId: string,
    walletAddress: string,
    txHash: string,
    identityHash: string,
    kycExpiry: number
  ): Promise<void> {
    try {
      if (!supabaseAdmin) {
        console.error('Database connection not available for logging');
        return;
      }
      
      await supabaseAdmin
        .from('audit_logs_enhanced')
        .insert({
          user_id: userId,
          action: 'kyc_registered_on_blockchain',
          resource_type: 'identity_registry',
          details: {
            walletAddress,
            txHash,
            identityHash,
            kycExpiry: new Date(kycExpiry * 1000).toISOString(),
            network: 'polygon-amoy',
            contractAddress: IDENTITY_REGISTRY_ADDRESS
          },
          severity: 'info',
          created_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Failed to log blockchain registration:', error);
    }
  }
}
