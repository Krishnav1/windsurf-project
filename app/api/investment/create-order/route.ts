/**
 * Create Investment Order API
 * Investor creates order to invest in asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { tokenId, amountInr, paymentMethod } = await request.json();

    if (!tokenId || !amountInr || !paymentMethod) {
      return NextResponse.json({ 
        error: 'Token ID, amount, and payment method required' 
      }, { status: 400 });
    }

    // Validate amount
    if (parseFloat(amountInr) <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    // Get token details
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('tokens')
      .select('*, asset_details(*)')
      .eq('id', tokenId)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Check if token is active
    if (tokenData.status !== 'active') {
      return NextResponse.json({ error: 'Token not available for investment' }, { status: 400 });
    }

    // Check if contract is deployed
    if (!tokenData.contract_address) {
      return NextResponse.json({ error: 'Token not deployed yet' }, { status: 400 });
    }

    // Calculate token quantity
    const pricePerToken = parseFloat(tokenData.asset_valuation) / parseFloat(tokenData.total_supply);
    const tokenQuantity = parseFloat(amountInr) / pricePerToken;

    // Check min/max investment limits
    const assetDetails = tokenData.asset_details;
    if (assetDetails) {
      if (assetDetails.min_investment && parseFloat(amountInr) < parseFloat(assetDetails.min_investment)) {
        return NextResponse.json({ 
          error: `Minimum investment is ₹${assetDetails.min_investment}` 
        }, { status: 400 });
      }
      if (assetDetails.max_investment && parseFloat(amountInr) > parseFloat(assetDetails.max_investment)) {
        return NextResponse.json({ 
          error: `Maximum investment is ₹${assetDetails.max_investment}` 
        }, { status: 400 });
      }
    }

    // Check investor KYC status
    const { data: investorIdentity } = await supabaseAdmin
      .from('investor_identities')
      .select('kyc_status, investment_limit, current_investment')
      .eq('user_id', decoded.userId)
      .single();

    if (!investorIdentity) {
      return NextResponse.json({ 
        error: 'Please complete KYC before investing' 
      }, { status: 400 });
    }

    if (investorIdentity.kyc_status !== 'approved') {
      return NextResponse.json({ 
        error: 'KYC not approved. Please wait for admin approval.' 
      }, { status: 400 });
    }

    // Check investment limit
    const newTotalInvestment = parseFloat(investorIdentity.current_investment) + parseFloat(amountInr);
    if (newTotalInvestment > parseFloat(investorIdentity.investment_limit)) {
      return NextResponse.json({ 
        error: `Investment limit exceeded. Your limit is ₹${investorIdentity.investment_limit}` 
      }, { status: 400 });
    }

    // Create investment order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('investment_orders')
      .insert({
        user_id: decoded.userId,
        token_id: tokenId,
        amount_inr: parseFloat(amountInr),
        token_quantity: tokenQuantity,
        price_per_token: pricePerToken,
        payment_method: paymentMethod,
        payment_status: 'pending',
        token_transfer_status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Log audit
    await supabaseAdmin.from('audit_logs').insert({
      user_id: decoded.userId,
      action: 'investment_order_created',
      resource_type: 'investment_order',
      resource_id: order.id,
      details: {
        tokenId,
        amountInr,
        tokenQuantity,
        paymentMethod
      },
      severity: 'info'
    });

    // Generate payment instructions based on method
    let paymentInstructions = {};
    
    if (paymentMethod === 'upi') {
      // In production, integrate with payment gateway
      paymentInstructions = {
        upiId: 'tokenplatform@paytm',
        qrCode: `upi://pay?pa=tokenplatform@paytm&pn=TokenPlatform&am=${amountInr}&cu=INR&tn=Investment-${order.id}`,
        instructions: 'Scan QR code or use UPI ID to pay. Transaction will be verified automatically.'
      };
    } else if (paymentMethod === 'inr') {
      paymentInstructions = {
        bankName: 'HDFC Bank',
        accountNumber: '50200012345678',
        ifscCode: 'HDFC0001234',
        accountName: 'TokenPlatform Pvt Ltd',
        amount: amountInr,
        reference: `INV-${order.id}`,
        instructions: 'Transfer amount and upload payment proof. Verification may take 1-2 hours.'
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Investment order created successfully',
      order: {
        id: order.id,
        tokenId: order.token_id,
        amountInr: order.amount_inr,
        tokenQuantity: order.token_quantity,
        pricePerToken: order.price_per_token,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        createdAt: order.created_at
      },
      paymentInstructions
    });

  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get user's investment orders
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data: orders, error } = await supabaseAdmin
      .from('investment_orders')
      .select(`
        *,
        tokens!investment_orders_token_id_fkey(
          id,
          token_name,
          token_symbol,
          asset_type
        )
      `)
      .eq('user_id', decoded.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch orders error:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orders
    });

  } catch (error: any) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
