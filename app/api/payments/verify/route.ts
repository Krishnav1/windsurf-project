/**
 * Payment Verification API
 * Verifies Razorpay payment and triggers blockchain execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';
import { RazorpayService } from '@/lib/payments/razorpayService';
import { TradeExecutor } from '@/lib/blockchain/tradeExecutor';
import { logError } from '@/lib/utils/errorHandler';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ 
        error: 'Missing payment verification parameters' 
      }, { status: 400 });
    }

    console.log('[Payment Verify] Verifying payment:', razorpay_payment_id);

    // Verify payment with Razorpay
    const result = await RazorpayService.handlePaymentSuccess({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!result.success) {
      return NextResponse.json({
        error: 'Payment verification failed',
        message: result.message
      }, { status: 400 });
    }

    console.log('[Payment Verify] ✓ Payment verified for order:', result.orderId);

    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        tokens:token_id (contract_address),
        user_wallets!inner(wallet_address)
      `)
      .eq('id', result.orderId)
      .eq('user_wallets.user_id', decoded.userId)
      .eq('user_wallets.is_primary', true)
      .single();

    if (orderError || !order) {
      console.error('[Payment Verify] Order not found:', orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user has a wallet
    if (!order.user_wallets || order.user_wallets.length === 0) {
      // Create custodial wallet for user
      console.log('[Payment Verify] Creating custodial wallet for user...');
      
      const wallet = await createCustodialWallet(decoded.userId);
      order.user_wallets = [{ wallet_address: wallet.address }];
    }

    const buyerWallet = order.user_wallets[0].wallet_address;

    // TRIGGER BLOCKCHAIN EXECUTION
    console.log('[Payment Verify] Triggering blockchain execution...');

    try {
      // Execute token transfer on blockchain
      const blockchainResult = await TradeExecutor.executeTokenTransfer({
        orderId: order.id,
        tokenAddress: order.tokens.contract_address,
        fromAddress: process.env.PLATFORM_WALLET_ADDRESS || '',
        toAddress: buyerWallet,
        amount: order.quantity.toString(),
        tokenId: order.token_id
      });

      console.log('[Payment Verify] ✅ Blockchain execution successful:', blockchainResult.txHash);

      return NextResponse.json({
        success: true,
        message: 'Payment verified and tokens transferred',
        order: {
          id: order.id,
          status: 'completed',
          quantity: order.quantity,
          totalAmount: order.total_amount
        },
        blockchain: {
          txHash: blockchainResult.txHash,
          blockNumber: blockchainResult.blockNumber,
          explorerUrl: `${process.env.NEXT_PUBLIC_BLOCK_EXPLORER}/tx/${blockchainResult.txHash}`
        }
      });

    } catch (blockchainError) {
      console.error('[Payment Verify] Blockchain execution failed:', blockchainError);

      // Payment succeeded but blockchain failed - need to refund
      console.log('[Payment Verify] Initiating refund due to blockchain failure...');

      try {
        await RazorpayService.initiateRefund(razorpay_payment_id);
      } catch (refundError) {
        console.error('[Payment Verify] Refund initiation failed:', refundError);
        // Log for manual intervention
        await supabaseAdmin
          .from('audit_logs_enhanced')
          .insert({
            user_id: decoded.userId,
            action: 'refund_required',
            resource_type: 'orders',
            resource_id: order.id,
            details: {
              payment_id: razorpay_payment_id,
              blockchain_error: (blockchainError as Error).message,
              refund_error: (refundError as Error).message
            },
            severity: 'critical'
          });
      }

      return NextResponse.json({
        error: 'Blockchain execution failed',
        message: 'Your payment will be refunded within 24 hours',
        details: (blockchainError as Error).message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[Payment Verify] Error:', error);
    logError('Payment Verification', error as Error);
    return NextResponse.json({
      error: 'Payment verification failed',
      details: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * Create custodial wallet for user
 */
async function createCustodialWallet(userId: string) {
  const { ethers } = await import('ethers');
  
  // Generate new wallet
  const wallet = ethers.Wallet.createRandom();
  
  // Encrypt private key
  const { DocumentEncryptionService } = await import('@/lib/security/documentEncryption');
  const encryptionResult = DocumentEncryptionService.encryptDocument(
    Buffer.from(wallet.privateKey)
  );

  if (!supabaseAdmin) {
    throw new Error('Database connection not available');
  }

  // Save wallet to database
  await supabaseAdmin
    .from('user_wallets')
    .insert({
      user_id: userId,
      wallet_type: 'custodial',
      wallet_address: wallet.address,
      encrypted_private_key: encryptionResult.encrypted.toString('base64'),
      encryption_iv: encryptionResult.iv,
      encryption_salt: encryptionResult.salt,
      is_primary: true,
      blockchain_network: 'polygon'
    });

  console.log('[Wallet] Created custodial wallet:', wallet.address);

  return wallet;
}
