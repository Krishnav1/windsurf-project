/**
 * ERC-3643 Service Layer
 * Handles all interactions with ERC-3643 security tokens
 */

import { ethers } from 'ethers';

// Window ethereum type declaration
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Placeholder ABI - will be replaced after deployment
const ERC3643_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function getFrozenTokens(address) view returns (uint256)",
  "function canTransfer(address from, address to, uint256 amount) view returns (bool)",
  "function freezePartialTokens(address addr, uint256 amount)",
  "function unfreezePartialTokens(address addr, uint256 amount)",
  "function pause()",
  "function unpause()",
  "function paused() view returns (bool)",
  "function mint(address to, uint256 amount)",
  "function burn(address from, uint256 amount)",
  "function recoveryAddress(address lostWallet, address newWallet, address investorID) returns (bool)"
];

// Contract addresses (will be set after deployment)
const ERC3643_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_ERC3643_TOKEN_ADDRESS || '';
const IDENTITY_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_ADDRESS || '';
const COMPLIANCE_ADDRESS = process.env.NEXT_PUBLIC_COMPLIANCE_ADDRESS || '';

export interface ComplianceCheckResult {
  canTransfer: boolean;
  reason: string;
  checks: {
    senderKYC: boolean;
    recipientKYC: boolean;
    tokensFrozen: boolean;
    investmentLimit: boolean;
    contractPaused: boolean;
  };
}

export interface InvestorInfo {
  address: string;
  category: 'retail' | 'accredited' | 'institutional' | 'founder';
  investmentLimit: number;
  currentInvestment: number;
  remainingCapacity: number;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  kycExpiresAt: Date | null;
}

export interface TokenBalance {
  total: number;
  frozen: number;
  available: number;
}

class ERC3643Service {
  private provider: ethers.providers.Web3Provider | null = null;
  private contract: ethers.Contract | null = null;

  /**
   * Initialize the service with a provider
   */
  async initialize() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    this.provider = new ethers.providers.Web3Provider(window.ethereum);
    
    if (!ERC3643_TOKEN_ADDRESS) {
      throw new Error('ERC3643 token address not configured');
    }

    this.contract = new ethers.Contract(
      ERC3643_TOKEN_ADDRESS,
      ERC3643_ABI,
      this.provider
    );
  }

  /**
   * Get signer for transactions
   */
  private async getSigner(): Promise<ethers.providers.JsonRpcSigner> {
    if (!this.provider) await this.initialize();
    return await this.provider!.getSigner();
  }

  /**
   * Check if an address is KYC verified
   */
  async isKYCVerified(address: string): Promise<boolean> {
    try {
      if (!this.contract) await this.initialize();
      
      // This would call the Identity Registry contract
      // For now, we'll check via API
      const response = await fetch(`/api/erc3643/kyc-status?address=${address}`);
      const data = await response.json();
      return data.verified;
    } catch (error) {
      console.error('Error checking KYC status:', error);
      return false;
    }
  }

  /**
   * Check if a transfer is compliant
   */
  async canTransfer(
    from: string,
    to: string,
    amount: number
  ): Promise<ComplianceCheckResult> {
    try {
      if (!this.contract) await this.initialize();

      // Call smart contract compliance check
      const canTransferOnChain = await this.contract!.canTransfer(
        from,
        to,
        ethers.utils.parseEther(amount.toString())
      );

      // Get detailed checks from API
      const response = await fetch('/api/erc3643/compliance-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, amount })
      });

      const data = await response.json();

      return {
        canTransfer: canTransferOnChain && data.passed,
        reason: data.reason || 'Transfer allowed',
        checks: data.checks || {
          senderKYC: true,
          recipientKYC: true,
          tokensFrozen: false,
          investmentLimit: true,
          contractPaused: false
        }
      };
    } catch (error) {
      console.error('Error checking compliance:', error);
      return {
        canTransfer: false,
        reason: 'Compliance check failed',
        checks: {
          senderKYC: false,
          recipientKYC: false,
          tokensFrozen: false,
          investmentLimit: false,
          contractPaused: false
        }
      };
    }
  }

  /**
   * Get token balance including frozen tokens
   */
  async getBalance(address: string): Promise<TokenBalance> {
    try {
      if (!this.contract) await this.initialize();

      const [totalBalance, frozenBalance] = await Promise.all([
        this.contract!.balanceOf(address),
        this.contract!.getFrozenTokens(address)
      ]);

      const total = parseFloat(ethers.utils.formatEther(totalBalance));
      const frozen = parseFloat(ethers.utils.formatEther(frozenBalance));

      return {
        total,
        frozen,
        available: total - frozen
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      return { total: 0, frozen: 0, available: 0 };
    }
  }

  /**
   * Get investor information
   */
  async getInvestorInfo(address: string): Promise<InvestorInfo | null> {
    try {
      const response = await fetch(`/api/erc3643/investor-info?address=${address}`);
      const data = await response.json();

      if (!data.success) return null;

      return {
        address: data.investor.wallet_address,
        category: data.investor.investor_category,
        investmentLimit: data.investor.investment_limit,
        currentInvestment: data.investor.current_investment,
        remainingCapacity: data.investor.investment_limit - data.investor.current_investment,
        kycStatus: data.investor.kyc_status,
        kycExpiresAt: data.investor.expires_at ? new Date(data.investor.expires_at) : null
      };
    } catch (error) {
      console.error('Error getting investor info:', error);
      return null;
    }
  }

  /**
   * Transfer tokens
   */
  async transfer(to: string, amount: number): Promise<string> {
    try {
      const signer = await this.getSigner();
      const contractWithSigner = this.contract!.connect(signer);

      const tx = await contractWithSigner.transfer(
        to,
        ethers.utils.parseEther(amount.toString())
      );

      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error('Transfer error:', error);
      throw new Error(error.message || 'Transfer failed');
    }
  }

  /**
   * Check if contract is paused
   */
  async isPaused(): Promise<boolean> {
    try {
      if (!this.contract) await this.initialize();
      return await this.contract!.paused();
    } catch (error) {
      console.error('Error checking pause status:', error);
      return false;
    }
  }

  /**
   * Get frozen tokens for an address
   */
  async getFrozenTokens(address: string): Promise<number> {
    try {
      if (!this.contract) await this.initialize();
      const frozen = await this.contract!.getFrozenTokens(address);
      return parseFloat(ethers.utils.formatEther(frozen));
    } catch (error) {
      console.error('Error getting frozen tokens:', error);
      return 0;
    }
  }

  // ============ ADMIN FUNCTIONS ============

  /**
   * Freeze tokens (Admin only)
   */
  async freezeTokens(address: string, amount: number, reason: string): Promise<string> {
    try {
      const signer = await this.getSigner();
      const contractWithSigner = this.contract!.connect(signer);

      const tx = await contractWithSigner.freezePartialTokens(
        address,
        ethers.utils.parseEther(amount.toString())
      );

      await tx.wait();

      // Log to database
      await fetch('/api/erc3643/freeze-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, amount, reason, txHash: tx.hash })
      });

      return tx.hash;
    } catch (error: any) {
      console.error('Freeze error:', error);
      throw new Error(error.message || 'Freeze failed');
    }
  }

  /**
   * Unfreeze tokens (Admin only)
   */
  async unfreezeTokens(address: string, amount: number): Promise<string> {
    try {
      const signer = await this.getSigner();
      const contractWithSigner = this.contract!.connect(signer);

      const tx = await contractWithSigner.unfreezePartialTokens(
        address,
        ethers.utils.parseEther(amount.toString())
      );

      await tx.wait();

      // Log to database
      await fetch('/api/erc3643/unfreeze-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, amount, txHash: tx.hash })
      });

      return tx.hash;
    } catch (error: any) {
      console.error('Unfreeze error:', error);
      throw new Error(error.message || 'Unfreeze failed');
    }
  }

  /**
   * Pause contract (Admin only)
   */
  async pauseContract(): Promise<string> {
    try {
      const signer = await this.getSigner();
      const contractWithSigner = this.contract!.connect(signer);

      const tx = await contractWithSigner.pause();
      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error('Pause error:', error);
      throw new Error(error.message || 'Pause failed');
    }
  }

  /**
   * Unpause contract (Admin only)
   */
  async unpauseContract(): Promise<string> {
    try {
      const signer = await this.getSigner();
      const contractWithSigner = this.contract!.connect(signer);

      const tx = await contractWithSigner.unpause();
      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error('Unpause error:', error);
      throw new Error(error.message || 'Unpause failed');
    }
  }

  /**
   * Mint tokens (Admin only)
   */
  async mintTokens(to: string, amount: number): Promise<string> {
    try {
      const signer = await this.getSigner();
      const contractWithSigner = this.contract!.connect(signer);

      const tx = await contractWithSigner.mint(
        to,
        ethers.utils.parseEther(amount.toString())
      );

      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error('Mint error:', error);
      throw new Error(error.message || 'Mint failed');
    }
  }

  /**
   * Burn tokens (Admin only)
   */
  async burnTokens(from: string, amount: number): Promise<string> {
    try {
      const signer = await this.getSigner();
      const contractWithSigner = this.contract!.connect(signer);

      const tx = await contractWithSigner.burn(
        from,
        ethers.utils.parseEther(amount.toString())
      );

      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error('Burn error:', error);
      throw new Error(error.message || 'Burn failed');
    }
  }

  /**
   * Recover wallet (Admin only)
   */
  async recoverWallet(
    oldWallet: string,
    newWallet: string,
    investorID: string
  ): Promise<string> {
    try {
      const signer = await this.getSigner();
      const contractWithSigner = this.contract!.connect(signer);

      const tx = await contractWithSigner.recoveryAddress(
        oldWallet,
        newWallet,
        investorID
      );

      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error('Recovery error:', error);
      throw new Error(error.message || 'Recovery failed');
    }
  }
}

// Export singleton instance
export const erc3643Service = new ERC3643Service();

// Export helper functions
export async function checkTransferCompliance(
  from: string,
  to: string,
  amount: number
): Promise<ComplianceCheckResult> {
  return erc3643Service.canTransfer(from, to, amount);
}

export async function getTokenBalance(address: string): Promise<TokenBalance> {
  return erc3643Service.getBalance(address);
}

export async function getInvestorDetails(address: string): Promise<InvestorInfo | null> {
  return erc3643Service.getInvestorInfo(address);
}
