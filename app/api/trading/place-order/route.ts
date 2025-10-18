/**
 * Place Order API Route
 * 
 * POST /api/trading/place-order
 * Handles buy/sell order placement with simulated matching
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Get user from database
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check KYC status
    if (user.kyc_status !== 'approved') {
      return NextResponse.json(
        { error: 'KYC approval required to trade' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tokenId, orderType, orderSide, quantity, price } = body;

    // Validate required fields
    if (!tokenId || !orderType || !orderSide || !quantity || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate order type and side
    if (!['buy', 'sell'].includes(orderType)) {
      return NextResponse.json(
        { error: 'Order type must be "buy" or "sell"' },
        { status: 400 }
      );
    }

    if (!['market', 'limit'].includes(orderSide)) {
      return NextResponse.json(
        { error: 'Order side must be "market" or "limit"' },
        { status: 400 }
      );
    }

    // Validate quantity and price
    const qty = parseFloat(quantity);
    const prc = parseFloat(price);

    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { error: 'Invalid quantity' },
        { status: 400 }
      );
    }

    if (isNaN(prc) || prc <= 0) {
      return NextResponse.json(
        { error: 'Invalid price' },
        { status: 400 }
      );
    }

    // Get token details
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('tokens')
      .select('*')
      .eq('id', tokenId)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    if (tokenData.status !== 'active') {
      return NextResponse.json(
        { error: 'Token is not active for trading' },
        { status: 400 }
      );
    }

    if (tokenData.is_frozen) {
      return NextResponse.json(
        { error: 'Token is frozen' },
        { status: 400 }
      );
    }

    // Calculate total order value
    const totalValue = qty * prc;

    // For sell orders, check if user has sufficient balance
    if (orderType === 'sell') {
      const { data: portfolio } = await supabaseAdmin
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
        .eq('token_id', tokenId)
        .single();

      const availableBalance = portfolio ? portfolio.balance - portfolio.locked_balance : 0;

      if (availableBalance < qty) {
        return NextResponse.json(
          { error: 'Insufficient token balance' },
          { status: 400 }
        );
      }
    }

    // For buy orders, check if user has sufficient demo balance
    if (orderType === 'buy') {
      if (user.demo_balance < totalValue) {
        return NextResponse.json(
          { error: 'Insufficient demo balance' },
          { status: 400 }
        );
      }
    }

    // Create order
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        token_id: tokenId,
        order_type: orderType,
        order_side: orderSide,
        quantity: qty,
        price: prc,
        filled_quantity: 0,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Simulate order matching for market orders
    if (orderSide === 'market') {
      await simulateOrderMatching(newOrder.id, user.id, tokenId, orderType, qty, prc);
    }

    // Log order placement
    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'order_placed',
      resource_type: 'order',
      resource_id: newOrder.id,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      details: {
        tokenSymbol: tokenData.token_symbol,
        orderType,
        orderSide,
        quantity: qty,
        price: prc,
      },
      severity: 'info',
    });

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully',
      order: {
        id: newOrder.id,
        tokenId: newOrder.token_id,
        orderType: newOrder.order_type,
        orderSide: newOrder.order_side,
        quantity: newOrder.quantity,
        price: newOrder.price,
        filledQuantity: newOrder.filled_quantity,
        status: newOrder.status,
        createdAt: newOrder.created_at,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Place order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Simulate order matching (for prototype)
 * In production, this would be a sophisticated matching engine
 */
async function simulateOrderMatching(
  orderId: string,
  userId: string,
  tokenId: string,
  orderType: 'buy' | 'sell',
  quantity: number,
  price: number
) {
  if (!supabaseAdmin) return;

  try {
    // Simulate instant fill for market orders
    const totalAmount = quantity * price;

    // Update order status to filled
    await supabaseAdmin
      .from('orders')
      .update({
        filled_quantity: quantity,
        status: 'filled',
      })
      .eq('id', orderId);

    // Update user's demo balance
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('demo_balance')
      .eq('id', userId)
      .single();

    if (user) {
      const newBalance = orderType === 'buy' 
        ? user.demo_balance - totalAmount 
        : user.demo_balance + totalAmount;

      await supabaseAdmin
        .from('users')
        .update({ demo_balance: newBalance })
        .eq('id', userId);
    }

    // Update or create portfolio entry
    const { data: existingPortfolio } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('token_id', tokenId)
      .single();

    if (existingPortfolio) {
      const newBalance = orderType === 'buy'
        ? existingPortfolio.balance + quantity
        : existingPortfolio.balance - quantity;

      await supabaseAdmin
        .from('portfolios')
        .update({ balance: newBalance })
        .eq('id', existingPortfolio.id);
    } else if (orderType === 'buy') {
      await supabaseAdmin
        .from('portfolios')
        .insert({
          user_id: userId,
          token_id: tokenId,
          balance: quantity,
          locked_balance: 0,
        });
    }

    // Create transaction record
    await supabaseAdmin.from('transactions').insert({
      transaction_type: 'trade',
      from_user_id: orderType === 'sell' ? userId : null,
      to_user_id: orderType === 'buy' ? userId : null,
      token_id: tokenId,
      quantity,
      price,
      total_amount: totalAmount,
      settlement_method: 'demo',
      settlement_status: 'completed',
      metadata: {
        orderId,
        orderType,
        simulatedMatch: true,
      },
    });

  } catch (error) {
    console.error('Order matching simulation error:', error);
  }
}

/**
 * GET /api/trading/place-order
 * Get user's orders
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Get user's orders
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        tokens:token_id (
          token_symbol,
          token_name
        )
      `)
      .eq('user_id', decoded.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orders,
    }, { status: 200 });

  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
