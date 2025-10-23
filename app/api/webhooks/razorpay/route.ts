/**
 * Razorpay Webhook Handler
 * Handles payment events from Razorpay
 */

import { NextRequest, NextResponse } from 'next/server';
import { RazorpayService } from '@/lib/payments/razorpayService';
import { TradeExecutor } from '@/lib/blockchain/tradeExecutor';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logError } from '@/lib/utils/errorHandler';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const payload = await request.json();
    
    console.log('[Razorpay Webhook] Received event:', payload.event);

    // Handle webhook
    await RazorpayService.handleWebhook(payload, signature);

    // If payment was successful, trigger blockchain execution
    if (payload.event === 'payment.captured' || payload.event === 'payment.authorized') {
      const paymentEntity = payload.payload.payment.entity;
      
      console.log('[Razorpay Webhook] Payment successful, triggering blockchain execution...');

      // Get order from payment
      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      const { data: settlement } = await supabaseAdmin
        .from('payment_settlements')
        .select(`
          *,
          orders (
            *,
            tokens:token_id (contract_address),
            user_wallets!inner(wallet_address)
          )
        `)
        .eq('gateway_order_id', paymentEntity.order_id)
        .single();

      if (settlement && settlement.orders) {
        const order = settlement.orders;
        
        // Check if user has wallet
        let buyerWallet = order.user_wallets?.[0]?.wallet_address;
        
        if (!buyerWallet) {
          // Create custodial wallet
          const { ethers } = await import('ethers');
          const wallet = ethers.Wallet.createRandom();
          
          const { DocumentEncryptionService } = await import('@/lib/security/documentEncryption');
          const encryptionResult = DocumentEncryptionService.encryptDocument(
            Buffer.from(wallet.privateKey)
          );

          await supabaseAdmin
            .from('user_wallets')
            .insert({
              user_id: order.user_id,
              wallet_type: 'custodial',
              wallet_address: wallet.address,
              encrypted_private_key: encryptionResult.encrypted.toString('base64'),
              encryption_iv: encryptionResult.iv,
              encryption_salt: encryptionResult.salt,
              is_primary: true,
              blockchain_network: 'polygon'
            });

          buyerWallet = wallet.address;
        }

        // Execute blockchain transfer asynchronously
        TradeExecutor.executeTokenTransfer({
          orderId: order.id,
          tokenAddress: order.tokens.contract_address,
          fromAddress: process.env.PLATFORM_WALLET_ADDRESS || '',
          toAddress: buyerWallet,
          amount: order.quantity.toString(),
          tokenId: order.token_id
        }).catch(error => {
          console.error('[Razorpay Webhook] Blockchain execution failed:', error);
          logError('Webhook Blockchain Execution', error as Error, { orderId: order.id });
          
          // Initiate refund
          RazorpayService.initiateRefund(paymentEntity.id).catch(refundError => {
            console.error('[Razorpay Webhook] Refund failed:', refundError);
          });
        });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Razorpay Webhook] Error:', error);
    logError('Razorpay Webhook', error as Error);
    return NextResponse.json({
      error: 'Webhook processing failed',
      details: (error as Error).message
    }, { status: 500 });
  }
}
