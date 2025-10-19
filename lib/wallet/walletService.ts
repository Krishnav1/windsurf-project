/**
 * Wallet Connection Service
 * Handles MetaMask connection and network switching for Polygon Amoy
 */

import { BrowserProvider } from 'ethers';

// Polygon Amoy network configuration
const POLYGON_AMOY_CONFIG = {
  chainId: '0x13882', // 80002 in hex
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  rpcUrls: ['https://rpc-amoy.polygon.technology/'],
  blockExplorerUrls: ['https://amoy.polygonscan.com/']
};

declare global {
  interface Window {
    ethereum?: any;
  }
}

export class WalletService {
  /**
   * Check if MetaMask is installed
   */
  static isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && Boolean(window.ethereum);
  }

  /**
   * Connect wallet and request account access
   */
  static async connectWallet(): Promise<string> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      return accounts[0];
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      }
      throw error;
    }
  }

  /**
   * Get currently connected address
   */
  static async getConnectedAddress(): Promise<string | null> {
    if (!this.isMetaMaskInstalled()) {
      return null;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });
      return accounts && accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('Error getting connected address:', error);
      return null;
    }
  }

  /**
   * Get current network chain ID
   */
  static async getCurrentChainId(): Promise<string> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask not installed');
    }

    return await window.ethereum.request({ method: 'eth_chainId' });
  }

  /**
   * Check if user is on Polygon Amoy network
   */
  static async isOnAmoy(): Promise<boolean> {
    try {
      const chainId = await this.getCurrentChainId();
      return chainId === POLYGON_AMOY_CONFIG.chainId;
    } catch (error) {
      return false;
    }
  }

  /**
   * Switch to Polygon Amoy network
   */
  static async switchToAmoy(): Promise<void> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask not installed');
    }

    try {
      // Try to switch to Amoy
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_AMOY_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [POLYGON_AMOY_CONFIG],
          });
        } catch (addError) {
          throw new Error('Failed to add Polygon Amoy network');
        }
      } else {
        throw switchError;
      }
    }
  }

  /**
   * Get MATIC balance
   */
  static async getMaticBalance(address: string): Promise<string> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask not installed');
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(address);
      return (Number(balance) / 1e18).toFixed(4); // Convert wei to MATIC
    } catch (error) {
      console.error('Error getting MATIC balance:', error);
      return '0';
    }
  }

  /**
   * Listen for account changes
   */
  static onAccountsChanged(callback: (accounts: string[]) => void): void {
    if (!this.isMetaMaskInstalled()) return;

    window.ethereum.on('accountsChanged', callback);
  }

  /**
   * Listen for network changes
   */
  static onChainChanged(callback: (chainId: string) => void): void {
    if (!this.isMetaMaskInstalled()) return;

    window.ethereum.on('chainChanged', callback);
  }

  /**
   * Remove event listeners
   */
  static removeAllListeners(): void {
    if (!this.isMetaMaskInstalled()) return;

    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');
  }

  /**
   * Disconnect wallet (clear local state)
   */
  static disconnect(): void {
    // MetaMask doesn't have a programmatic disconnect
    // Just clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');
    }
  }

  /**
   * Save wallet connection state
   */
  static saveConnectionState(address: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', address);
    }
  }

  /**
   * Check if wallet was previously connected
   */
  static wasConnected(): boolean {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('walletConnected') === 'true';
    }
    return false;
  }

  /**
   * Get saved wallet address
   */
  static getSavedAddress(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('walletAddress');
    }
    return null;
  }
}

// Export helper functions
export async function connectWallet(): Promise<string> {
  return WalletService.connectWallet();
}

export async function getConnectedAddress(): Promise<string | null> {
  return WalletService.getConnectedAddress();
}

export async function switchToAmoy(): Promise<void> {
  return WalletService.switchToAmoy();
}

export async function isOnAmoy(): Promise<boolean> {
  return WalletService.isOnAmoy();
}

export async function getMaticBalance(address: string): Promise<string> {
  return WalletService.getMaticBalance(address);
}
