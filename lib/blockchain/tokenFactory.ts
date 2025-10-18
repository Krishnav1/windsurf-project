/**
 * Token Factory - Smart Contract Deployment
 * 
 * Handles deployment of SecurityToken contracts to blockchain
 * Manages token minting and on-chain metadata anchoring
 */

import { ethers, Contract } from 'ethers';
import { getProvider, getWallet } from './config';
import SecurityTokenABI from '../../artifacts/contracts/SecurityToken.sol/SecurityToken.json';

export interface TokenDeploymentParams {
  name: string;
  symbol: string;
  totalSupply: string; // In token units (will be converted with decimals)
  decimals: number;
  assetType: string;
  metadataHash: string;
  deployerPrivateKey?: string;
}

export interface DeploymentResult {
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  tokenId: string;
}

/**
 * Deploy a new SecurityToken contract
 * 
 * @param params - Token deployment parameters
 * @returns Deployment result with contract address and transaction details
 */
export async function deploySecurityToken(
  params: TokenDeploymentParams
): Promise<DeploymentResult> {
  try {
    const provider = getProvider();
    const wallet = getWallet(params.deployerPrivateKey);

    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    if (balance === 0n) {
      throw new Error(
        'Insufficient funds for deployment. Please fund your wallet with testnet MATIC from https://faucet.polygon.technology/'
      );
    }

    // Convert total supply to wei (with decimals)
    const totalSupplyWithDecimals = ethers.parseUnits(
      params.totalSupply,
      params.decimals
    );

    // Create contract factory
    const SecurityTokenFactory = new ethers.ContractFactory(
      SecurityTokenABI.abi,
      SecurityTokenABI.bytecode,
      wallet
    );

    console.log('Deploying SecurityToken contract...');
    console.log('Parameters:', {
      name: params.name,
      symbol: params.symbol,
      totalSupply: params.totalSupply,
      decimals: params.decimals,
      assetType: params.assetType,
      metadataHash: params.metadataHash,
    });

    // Deploy contract
    const contract = await SecurityTokenFactory.deploy(
      params.name,
      params.symbol,
      totalSupplyWithDecimals,
      params.decimals,
      params.assetType,
      params.metadataHash
    );

    // Wait for deployment
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    
    // Get deployment transaction
    const deploymentTx = contract.deploymentTransaction();
    if (!deploymentTx) {
      throw new Error('Deployment transaction not found');
    }

    // Wait for transaction confirmation
    const receipt = await deploymentTx.wait();
    if (!receipt) {
      throw new Error('Transaction receipt not found');
    }

    console.log('Contract deployed successfully!');
    console.log('Contract Address:', contractAddress);
    console.log('Transaction Hash:', receipt.hash);
    console.log('Block Number:', receipt.blockNumber);

    return {
      contractAddress,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      tokenId: `${contractAddress}-${params.symbol}`,
    };
  } catch (error: any) {
    console.error('Token deployment error:', error);
    throw new Error(`Failed to deploy token: ${error.message}`);
  }
}

/**
 * Get token contract instance
 * 
 * @param contractAddress - Address of deployed token contract
 * @param signerPrivateKey - Optional private key for write operations
 * @returns Contract instance
 */
export function getTokenContract(
  contractAddress: string,
  signerPrivateKey?: string
): Contract {
  const provider = getProvider();
  
  if (signerPrivateKey) {
    const wallet = getWallet(signerPrivateKey);
    return new ethers.Contract(contractAddress, SecurityTokenABI.abi, wallet);
  }
  
  return new ethers.Contract(contractAddress, SecurityTokenABI.abi, provider);
}

/**
 * Freeze a token holder's account (compliance feature)
 * 
 * @param contractAddress - Token contract address
 * @param accountAddress - Address to freeze
 * @param reason - Reason for freezing
 * @param adminPrivateKey - Admin wallet private key
 * @returns Transaction hash
 */
export async function freezeAccount(
  contractAddress: string,
  accountAddress: string,
  reason: string,
  adminPrivateKey: string
): Promise<string> {
  try {
    const contract = getTokenContract(contractAddress, adminPrivateKey);
    const tx = await contract.freezeAccount(accountAddress, reason);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error: any) {
    throw new Error(`Failed to freeze account: ${error.message}`);
  }
}

/**
 * Unfreeze a token holder's account
 * 
 * @param contractAddress - Token contract address
 * @param accountAddress - Address to unfreeze
 * @param adminPrivateKey - Admin wallet private key
 * @returns Transaction hash
 */
export async function unfreezeAccount(
  contractAddress: string,
  accountAddress: string,
  adminPrivateKey: string
): Promise<string> {
  try {
    const contract = getTokenContract(contractAddress, adminPrivateKey);
    const tx = await contract.unfreezeAccount(accountAddress);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error: any) {
    throw new Error(`Failed to unfreeze account: ${error.message}`);
  }
}

/**
 * Whitelist an address for token transfers
 * 
 * @param contractAddress - Token contract address
 * @param accountAddress - Address to whitelist
 * @param adminPrivateKey - Admin wallet private key
 * @returns Transaction hash
 */
export async function whitelistAddress(
  contractAddress: string,
  accountAddress: string,
  adminPrivateKey: string
): Promise<string> {
  try {
    const contract = getTokenContract(contractAddress, adminPrivateKey);
    const tx = await contract.whitelistAddress(accountAddress);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error: any) {
    throw new Error(`Failed to whitelist address: ${error.message}`);
  }
}

/**
 * Get token balance of an address
 * 
 * @param contractAddress - Token contract address
 * @param accountAddress - Address to check
 * @returns Balance as string
 */
export async function getTokenBalance(
  contractAddress: string,
  accountAddress: string
): Promise<string> {
  try {
    const contract = getTokenContract(contractAddress);
    const balance = await contract.balanceOf(accountAddress);
    const decimals = await contract.decimals();
    return ethers.formatUnits(balance, decimals);
  } catch (error: any) {
    throw new Error(`Failed to get token balance: ${error.message}`);
  }
}

/**
 * Transfer tokens between addresses
 * 
 * @param contractAddress - Token contract address
 * @param toAddress - Recipient address
 * @param amount - Amount to transfer (in token units)
 * @param senderPrivateKey - Sender's private key
 * @returns Transaction hash
 */
export async function transferTokens(
  contractAddress: string,
  toAddress: string,
  amount: string,
  senderPrivateKey: string
): Promise<string> {
  try {
    const contract = getTokenContract(contractAddress, senderPrivateKey);
    const decimals = await contract.decimals();
    const amountWithDecimals = ethers.parseUnits(amount, decimals);
    
    const tx = await contract.transfer(toAddress, amountWithDecimals);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error: any) {
    throw new Error(`Failed to transfer tokens: ${error.message}`);
  }
}
