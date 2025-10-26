/**
 * Trading API - Place Order
 * Handles order placement and retrieval
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/auth/jwt';
import { SupabaseQueue } from '@/lib/queue/supabaseQueue';
import { SupabaseCacheService } from '@/lib/cache/supabaseCache';
import { rateLimitByUser, moderateRateLimit } from '@/lib/middleware/supabaseRateLimiter';

// GET - Fetch user's orders
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Try cache first
    const cacheKey = `orders:${decoded.userId}`;
    const cached = await SupabaseCacheService.get(cacheKey);
    
    if (cached) {
      return NextResponse.json({
        success: true,
        orders: cached,
        cached: true
      });
    }

    // Fetch user's orders
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', decoded.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Trading API] Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Cache for 30 seconds
    await SupabaseCacheService.set(cacheKey, orders, 30);

    return NextResponse.json({
      success: true,
      orders: orders || []
    });

  } catch (error) {
    console.error('[Trading API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Place new order
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Rate limiting
    const rateLimit = await rateLimitByUser(decoded.userId, '/api/trading/place-order', moderateRateLimit);
    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: 'Too many requests',
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      }, { status: 429 });
    }

    const body = await request.json();
    const { tokenId, orderType, orderSide, quantity, price } = body;

    // Validate inputs
    if (!tokenId || !orderType || !quantity || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (quantity <= 0 || price <= 0) {
      return NextResponse.json({ error: 'Invalid quantity or price' }, { status: 400 });
    }

    // Check user KYC status
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('kyc_status')
      .eq('id', decoded.userId)
      .single();

    if (!user || user.kyc_status !== 'approved') {
      return NextResponse.json({ 
        error: 'KYC verification required',
        kycRequired: true 
      }, { status: 403 });
    }

    // Calculate amounts
    const totalAmount = quantity * price;
    const platformFee = totalAmount * 0.01; // 1% fee
    const gasEstimate = 5; // ₹5 gas fee
    const netAmount = totalAmount + platformFee + gasEstimate;

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: decoded.userId,
        token_id: tokenId,
        side: orderType,
        order_type: orderSide || 'market',
        quantity: quantity,
        price: price,
        total_amount: totalAmount,
        platform_fee: platformFee,
        gas_fee: gasEstimate,
        net_amount: netAmount,
        status: 'pending',
        payment_method: 'upi',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('[Trading API] Error creating order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Enqueue job for async processing
    const jobId = await SupabaseQueue.enqueue(
      'token_transfer',
      {
        orderId: order.id,
        tokenId,
        quantity,
        price,
        side: orderType
      },
      {
        userId: decoded.userId,
        orderId: order.id,
        priority: 1
      }
    );

    // Invalidate cache
    await SupabaseCacheService.delete(`orders:${decoded.userId}`);

    return NextResponse.json({
      success: true,
      order: order,
      jobId: jobId,
      message: 'Order placed successfully and queued for processing'
    });

  } catch (error) {
    console.error('[Trading API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
