/**
 * Blockchain Trade Executor
 * Executes token transfers on blockchain after payment confirmation
 */

import { JsonRpcProvider, Wallet, Contract, parseUnits, formatUnits } from 'ethers';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logError } from '@/lib/utils/errorHandler';

// ERC3643 Token ABI (minimal for transfer operations)
const ERC3643_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function isVerified(address account) view returns (bool)',
  'function canTransfer(address from, address to, uint256 amount) view returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

export interface TokenTransferParams {
  orderId: string;
  tokenAddress: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  tokenId: string;
}

export class TradeExecutor {
  
  private static provider: JsonRpcProvider;
  private static wallet: Wallet;

  /**
   * Initialize blockchain connection
   */
  static initialize() {
    if (!this.provider) {
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
      if (!rpcUrl) {
        throw new Error('Blockchain RPC URL not configured');
      }

      this.provider = new JsonRpcProvider(rpcUrl);
      
      const privateKey = process.env.PLATFORM_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('Platform private key not configured');
      }

      this.wallet = new Wallet(privateKey, this.provider);
      console.log('[Trade Executor] Initialized with wallet:', this.wallet.address);
    }
  }

  /**
   * Execute token transfer on blockchain
   */
  static async executeTokenTransfer(params: TokenTransferParams) {
    try {
      this.initialize();

      console.log('[Trade Executor] Starting token transfer for order:', params.orderId);
      console.log('[Trade Executor] From:', params.fromAddress);
      console.log('[Trade Executor] To:', params.toAddress);
      console.log('[Trade Executor] Amount:', params.amount);

      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      // Update order status to executing
      await supabaseAdmin
        .from('orders')
        .update({ 
          status: 'executing',
          blockchain_status: 'pending'
        })
        .eq('id', params.orderId);

      // Load token contract
      const tokenContract = new Contract(
        params.tokenAddress,
        ERC3643_ABI,
        this.wallet
      );

      // PRE-FLIGHT CHECKS
      console.log('[Trade Executor] Running pre-flight checks...');

      // 1. Check if buyer is KYC verified on-chain
      const isVerified = await tokenContract.isVerified(params.toAddress);
      if (!isVerified) {
        throw new Error('Buyer not KYC verified on blockchain');
      }
      console.log('[Trade Executor] ✓ Buyer KYC verified on-chain');

      // 2. Check if transfer is allowed by compliance rules
      const amountInWei = parseUnits(params.amount, 18);
      const canTransfer = await tokenContract.canTransfer(
        params.fromAddress,
        params.toAddress,
        amountInWei
      );
      
      if (!canTransfer) {
        throw new Error('Transfer not allowed by compliance rules');
      }
      console.log('[Trade Executor] ✓ Transfer allowed by compliance');

      // 3. Check platform wallet balance
      const balance = await tokenContract.balanceOf(this.wallet.address);
      if (balance.lt(amountInWei)) {
        throw new Error(`Insufficient token balance. Required: ${params.amount}, Available: ${formatUnits(balance, 18)}`);
      }
      console.log('[Trade Executor] ✓ Sufficient balance');

      // EXECUTE TRANSFER
      console.log('[Trade Executor] Executing transfer...');

      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || 0n;
      const gasLimit = 300000; // Estimate for ERC3643 transfer

      const tx = await tokenContract.transfer(
        params.toAddress,
        amountInWei,
        {
          gasLimit: gasLimit,
          gasPrice: gasPrice
        }
      );

      console.log('[Trade Executor] Transaction submitted:', tx.hash);

      // Save blockchain transaction record
      const { data: blockchainTx, error: txError } = await supabaseAdmin
        .from('blockchain_transactions')
        .insert({
          order_id: params.orderId,
          user_id: (await supabaseAdmin.from('orders').select('user_id').eq('id', params.orderId).single()).data?.user_id,
          transaction_type: 'token_transfer',
          from_address: this.wallet.address,
          to_address: params.toAddress,
          token_address: params.tokenAddress,
          amount: params.amount,
          tx_hash: tx.hash,
          gas_price: formatUnits(gasPrice, 'gwei'),
          status: 'pending',
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (txError) {
        console.error('[Trade Executor] Failed to save blockchain tx:', txError);
      }

      // Update order with transaction hash
      await supabaseAdmin
        .from('orders')
        .update({
          blockchain_tx_hash: tx.hash,
          blockchain_status: 'pending'
        })
        .eq('id', params.orderId);

      // WAIT FOR CONFIRMATION
      console.log('[Trade Executor] Waiting for confirmation...');
      const receipt = await tx.wait(3); // Wait for 3 confirmations

      console.log('[Trade Executor] ✅ Transaction confirmed in block:', receipt.blockNumber);

      // Calculate gas cost in INR (approximate)
      const gasUsed = receipt.gasUsed;
      const gasCostWei = gasUsed.mul(gasPrice);
      const gasCostEth = parseFloat(formatUnits(gasCostWei, 18));
      const ethPriceInr = 150000; // Approximate, should fetch from oracle
      const gasCostInr = gasCostEth * ethPriceInr;

      // Update blockchain transaction
      if (blockchainTx) {
        await supabaseAdmin
          .from('blockchain_transactions')
          .update({
            status: 'confirmed',
            block_number: receipt.blockNumber,
            gas_used: gasUsed.toString(),
            gas_cost_inr: gasCostInr,
            confirmations: 3,
            confirmed_at: new Date().toISOString()
          })
          .eq('id', blockchainTx.id);
      }

      // Update order status to completed
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'completed',
          blockchain_status: 'confirmed',
          completed_at: new Date().toISOString()
        })
        .eq('id', params.orderId);

      // Update user holdings
      await this.updateUserHoldings({
        userAddress: params.toAddress,
        tokenAddress: params.tokenAddress,
        tokenId: params.tokenId,
        amount: params.amount,
        orderId: params.orderId
      });

      // Create success notification
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('user_id, quantity, price')
        .eq('id', params.orderId)
        .single();

      if (order) {
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: order.user_id,
            type: 'trade_completed',
            title: '🎉 Trade Completed Successfully!',
            message: `Your purchase of ${order.quantity} tokens has been completed. Tokens have been transferred to your wallet.`,
            priority: 'critical',
            metadata: {
              order_id: params.orderId,
              tx_hash: tx.hash,
              block_number: receipt.blockNumber,
              amount: params.amount,
              wallet_address: params.toAddress
            }
          });
      }

      console.log('[Trade Executor] ✅ Trade execution complete');

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: gasUsed.toString(),
        gasCostInr: gasCostInr
      };

    } catch (error) {
      console.error('[Trade Executor] ❌ Trade execution failed:', error);

      if (!supabaseAdmin) {
        throw error;
      }

      // Update order status to failed
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'failed',
          blockchain_status: 'failed',
          error_message: (error as Error).message
        })
        .eq('id', params.orderId);

      // Update blockchain transaction if exists
      const { data: blockchainTx } = await supabaseAdmin
        .from('blockchain_transactions')
        .select('id')
        .eq('order_id', params.orderId)
        .single();

      if (blockchainTx) {
        await supabaseAdmin
          .from('blockchain_transactions')
          .update({
            status: 'failed',
            error_message: (error as Error).message
          })
          .eq('id', blockchainTx.id);
      }

      // Create failure notification
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('user_id')
        .eq('id', params.orderId)
        .single();

      if (order) {
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: order.user_id,
            type: 'trade_failed',
            title: 'Trade Failed',
            message: `Your trade failed: ${(error as Error).message}. Your payment will be refunded within 24 hours.`,
            priority: 'high',
            metadata: {
              order_id: params.orderId,
              error: (error as Error).message
            }
          });
      }

      logError('Trade Execution', error as Error, params);
      throw error;
    }
  }

  /**
   * Update user holdings after successful transfer
   */
  static async updateUserHoldings(params: {
    userAddress: string;
    tokenAddress: string;
    tokenId: string;
    amount: string;
    orderId: string;
  }) {
    try {
      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      console.log('[Trade Executor] Updating user holdings...');

      // Get user from wallet address
      const { data: wallet } = await supabaseAdmin
        .from('user_wallets')
        .select('user_id')
        .eq('wallet_address', params.userAddress)
        .single();

      if (!wallet) {
        console.warn('[Trade Executor] User wallet not found, skipping holdings update');
        return;
      }

      // Get order details for price calculation
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('price, total_amount')
        .eq('id', params.orderId)
        .single();

      // Check if holding exists
      const { data: existing } = await supabaseAdmin
        .from('user_holdings')
        .select('*')
        .eq('user_id', wallet.user_id)
        .eq('token_id', params.tokenId)
        .single();

      const quantity = parseFloat(params.amount);
      const price = order?.price || 0;
      const totalInvested = order?.total_amount || 0;

      if (existing) {
        // Update existing holding
        const newQuantity = parseFloat(existing.quantity) + quantity;
        const newTotalInvested = (existing.total_invested || 0) + totalInvested;
        const newAvgPrice = newTotalInvested / newQuantity;

        await supabaseAdmin
          .from('user_holdings')
          .update({
            quantity: newQuantity,
            avg_purchase_price: newAvgPrice,
            total_invested: newTotalInvested,
            blockchain_verified: true,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        console.log('[Trade Executor] ✓ Holdings updated');
      } else {
        // Create new holding
        await supabaseAdmin
          .from('user_holdings')
          .insert({
            user_id: wallet.user_id,
            token_id: params.tokenId,
            quantity: quantity,
            avg_purchase_price: price,
            total_invested: totalInvested,
            wallet_address: params.userAddress,
            blockchain_verified: true,
            last_synced_at: new Date().toISOString()
          });

        console.log('[Trade Executor] ✓ New holding created');
      }

    } catch (error) {
      console.error('[Trade Executor] Holdings update failed:', error);
      logError('Holdings Update', error as Error, params);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Sync holdings from blockchain
   */
  static async syncHoldingsFromBlockchain(userId: string, tokenAddress: string) {
    try {
      this.initialize();

      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      // Get user's wallet
      const { data: wallet } = await supabaseAdmin
        .from('user_wallets')
        .select('wallet_address')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .single();

      if (!wallet) {
        throw new Error('User wallet not found');
      }

      // Get balance from blockchain
      const tokenContract = new Contract(
        tokenAddress,
        ERC3643_ABI,
        this.provider
      );

      const balance = await tokenContract.balanceOf(wallet.wallet_address);
      const balanceFormatted = formatUnits(balance, 18);

      console.log('[Trade Executor] On-chain balance:', balanceFormatted);

      // Update holdings
      const { data: token } = await supabaseAdmin
        .from('tokens')
        .select('id')
        .eq('contract_address', tokenAddress)
        .single();

      if (token) {
        await supabaseAdmin
          .from('user_holdings')
          .upsert({
            user_id: userId,
            token_id: token.id,
            quantity: balanceFormatted,
            wallet_address: wallet.wallet_address,
            blockchain_verified: true,
            last_synced_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,token_id'
          });

        console.log('[Trade Executor] ✓ Holdings synced from blockchain');
      }

      return {
        success: true,
        balance: balanceFormatted
      };

    } catch (error) {
      console.error('[Trade Executor] Sync failed:', error);
      logError('Blockchain Sync', error as Error, { userId, tokenAddress });
      throw error;
    }
  }
}
