/**
 * Blockchain Configuration
 * 
 * Configuration for Polygon Mumbai testnet and Alchemy RPC provider
 * Used for token minting, transfers, and on-chain verification
 */

import { ethers } from 'ethers';

// Network configuration
export const CHAIN_CONFIG = {
  chainId: 80001, // Polygon Mumbai testnet
  name: 'Polygon Mumbai',
  rpcUrl: process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || '',
  blockExplorer: 'https://mumbai.polygonscan.com',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
};

/**
 * Get JSON-RPC provider for blockchain interactions
 */
export function getProvider(): ethers.JsonRpcProvider {
  if (!CHAIN_CONFIG.rpcUrl) {
    throw new Error('Alchemy RPC URL not configured');
  }
  return new ethers.JsonRpcProvider(CHAIN_CONFIG.rpcUrl);
}

/**
 * Get wallet instance for contract deployment and transactions
 * Note: In production, use secure key management (HSM, KMS)
 */
export function getWallet(privateKey?: string): ethers.Wallet {
  const provider = getProvider();
  
  if (!privateKey) {
    // Generate new wallet for demo purposes
    return ethers.Wallet.createRandom().connect(provider);
  }
  
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Format blockchain explorer URL for transaction
 */
export function getExplorerUrl(txHash: string): string {
  return `${CHAIN_CONFIG.blockExplorer}/tx/${txHash}`;
}

/**
 * Format blockchain explorer URL for address
 */
export function getAddressExplorerUrl(address: string): string {
  return `${CHAIN_CONFIG.blockExplorer}/address/${address}`;
}

/**
 * Format blockchain explorer URL for token
 */
export function getTokenExplorerUrl(contractAddress: string): string {
  return `${CHAIN_CONFIG.blockExplorer}/token/${contractAddress}`;
}
