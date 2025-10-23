/**
 * Trade Execution API
 * Complete end-to-end trade flow: Order → Payment → Blockchain → Settlement
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';
import { checkKYCStatus, checkInvestmentLimit } from '@/lib/middleware/requireKYC';
import { RazorpayService } from '@/lib/payments/razorpayService';
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

    // ✅ KYC CHECK
    console.log('[Trade Execute] Checking KYC for user:', decoded.userId);
    const kycCheck = await checkKYCStatus(token);
    
    if (!kycCheck.allowed) {
      return NextResponse.json({
        error: 'KYC verification required',
        kycRequired: true,
        kycStatus: kycCheck.kycStatus,
        message: kycCheck.message,
        redirectTo: '/settings/kyc'
      }, { status: 403 });
    }

    const { tokenId, side, quantity, price, settlementMethod = 'upi' } = await request.json();

    // Validate inputs
    if (!tokenId || !side || !quantity || !price) {
      return NextResponse.json({ 
        error: 'Missing required fields: tokenId, side, quantity, price' 
      }, { status: 400 });
    }

    if (!['buy', 'sell'].includes(side)) {
      return NextResponse.json({ error: 'side must be "buy" or "sell"' }, { status: 400 });
    }

    const qty = Number(quantity);
    const prc = Number(price);

    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'quantity must be a positive number' }, { status: 400 });
    }

    if (isNaN(prc) || prc <= 0) {
      return NextResponse.json({ error: 'price must be a positive number' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // Get token details
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('tokens')
      .select('*')
      .eq('id', tokenId)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Calculate amounts
    const totalAmount = qty * prc;
    const platformFeePercent = 0.01; // 1%
    const platformFee = totalAmount * platformFeePercent;
    const gasEstimate = 5; // ₹5 estimated gas fee
    const netAmount = totalAmount + platformFee + gasEstimate;

    // ✅ INVESTMENT LIMIT CHECK (for buy orders)
    if (side === 'buy') {
      const limitCheck = await checkInvestmentLimit(decoded.userId, totalAmount);
      
      if (!limitCheck.allowed) {
        return NextResponse.json({
          error: 'Investment limit exceeded',
          message: limitCheck.message,
          remainingLimit: limitCheck.limit,
          requestedAmount: totalAmount
        }, { status: 403 });
      }
    }

    // Get user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('email, mobile, full_name')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // CREATE ORDER
    console.log('[Trade Execute] Creating order...');
    
    const orderExpiry = new Date();
    orderExpiry.setMinutes(orderExpiry.getMinutes() + 15); // 15 minute expiry

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: decoded.userId,
        token_id: tokenId,
        side: side,
        order_type: 'market',
        quantity: qty,
        price: prc,
        total_amount: totalAmount,
        platform_fee: platformFee,
        gas_fee: gasEstimate,
        net_amount: netAmount,
        status: 'pending',
        payment_method: settlementMethod,
        expires_at: orderExpiry.toISOString()
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('[Trade Execute] Order creation failed:', orderError);
      return NextResponse.json({ 
        error: 'Failed to create order',
        details: orderError?.message 
      }, { status: 500 });
    }

    console.log('[Trade Execute] ✓ Order created:', order.id);

    // CREATE AUDIT LOG
    await supabaseAdmin
      .from('audit_logs_enhanced')
      .insert({
        user_id: decoded.userId,
        action: 'order_created',
        resource_type: 'orders',
        resource_id: order.id,
        details: {
          token_id: tokenId,
          token_name: tokenData.name,
          side: side,
          quantity: qty,
          price: prc,
          total_amount: totalAmount,
          platform_fee: platformFee
        },
        severity: 'info'
      });

    // INITIATE PAYMENT (for buy orders)
    if (side === 'buy' && settlementMethod === 'upi') {
      try {
        console.log('[Trade Execute] Initiating UPI payment...');
        
        const paymentOrder = await RazorpayService.createPaymentOrder({
          orderId: order.id,
          amount: netAmount,
          userId: decoded.userId,
          userEmail: user.email,
          userPhone: user.mobile
        });

        console.log('[Trade Execute] ✓ Payment order created:', paymentOrder.razorpayOrderId);

        return NextResponse.json({
          success: true,
          message: 'Order created successfully',
          order: {
            id: order.id,
            tokenId: tokenId,
            tokenName: tokenData.name,
            side: side,
            quantity: qty,
            price: prc,
            totalAmount: totalAmount,
            platformFee: platformFee,
            gasEstimate: gasEstimate,
            netAmount: netAmount,
            status: order.status,
            expiresAt: order.expires_at
          },
          payment: {
            required: true,
            method: 'upi',
            razorpayOrderId: paymentOrder.razorpayOrderId,
            amount: paymentOrder.amount,
            currency: paymentOrder.currency,
            keyId: paymentOrder.keyId
          },
          nextStep: 'complete_payment'
        });

      } catch (paymentError) {
        console.error('[Trade Execute] Payment initiation failed:', paymentError);
        
        // Mark order as failed
        await supabaseAdmin
          .from('orders')
          .update({ 
            status: 'failed',
            error_message: 'Payment initiation failed'
          })
          .eq('id', order.id);

        return NextResponse.json({
          error: 'Payment initiation failed',
          details: (paymentError as Error).message
        }, { status: 500 });
      }
    }

    // For sell orders or other payment methods
    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order.id,
        tokenId: tokenId,
        tokenName: tokenData.name,
        side: side,
        quantity: qty,
        price: prc,
        totalAmount: totalAmount,
        status: order.status
      },
      payment: {
        required: false
      },
      nextStep: side === 'sell' ? 'awaiting_execution' : 'complete_payment'
    });

  } catch (error) {
    console.error('[Trade Execute] Error:', error);
    logError('Trade Execution', error as Error);
    return NextResponse.json({
      error: 'Trade execution failed',
      details: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * GET: Fetch order status
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // Get order with related data
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        tokens:token_id (name, symbol, contract_address),
        payment_settlements (*),
        blockchain_transactions (*)
      `)
      .eq('id', orderId)
      .eq('user_id', decoded.userId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: order
    });

  } catch (error) {
    console.error('[Trade Execute] Get order error:', error);
    return NextResponse.json({
      error: 'Failed to fetch order',
      details: (error as Error).message
    }, { status: 500 });
  }
}
