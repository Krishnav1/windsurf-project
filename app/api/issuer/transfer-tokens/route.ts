/**
 * Issuer Transfer Tokens API
 * Transfers tokens from issuer to investor after payment verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';
import { ethers } from 'ethers';
import { getProvider } from '@/lib/blockchain/config';

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

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('investment_orders')
      .select(`
        *,
        tokens!investment_orders_token_id_fkey(*),
        users!investment_orders_user_id_fkey(*)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if payment is verified
    if (order.payment_status !== 'verified') {
      return NextResponse.json({ 
        error: 'Payment not verified yet' 
      }, { status: 400 });
    }

    // Check if already transferred
    if (order.token_transfer_status === 'completed') {
      return NextResponse.json({ 
        error: 'Tokens already transferred',
        txHash: order.token_transfer_tx_hash
      }, { status: 400 });
    }

    const tokenData = order.tokens;
    
    if (!tokenData.contract_address) {
      return NextResponse.json({ error: 'Token not deployed' }, { status: 400 });
    }

    // Get investor wallet address
    const { data: investorIdentity } = await supabaseAdmin
      .from('investor_identities')
      .select('wallet_address')
      .eq('user_id', order.user_id)
      .single();

    if (!investorIdentity || !investorIdentity.wallet_address) {
      return NextResponse.json({ 
        error: 'Investor wallet not found. Please connect wallet first.' 
      }, { status: 400 });
    }

    // Get issuer wallet from token
    const provider = getProvider();
    const ERC3643TokenABI = require('@/lib/blockchain/abis/ERC3643Token.json');
    
    const tokenContract = new ethers.Contract(
      tokenData.contract_address,
      ERC3643TokenABI.abi,
      provider
    );

    // Get issuer address from contract
    const issuerAddress = await tokenContract.issuer();

    // Get issuer private key (in production, use secure key management)
    // For now, we'll use deployer key as issuer
    const issuerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
    
    if (!issuerPrivateKey) {
      return NextResponse.json({ error: 'Issuer key not configured' }, { status: 500 });
    }

    const issuerWallet = new ethers.Wallet(issuerPrivateKey, provider);
    const tokenContractWithSigner = tokenContract.connect(issuerWallet);

    // Transfer tokens
    const transferAmount = ethers.parseUnits(
      order.token_quantity.toString(), 
      tokenData.decimals || 8
    );

    const transferTx = await tokenContractWithSigner.transfer(
      investorIdentity.wallet_address,
      transferAmount
    );

    const receipt = await transferTx.wait();

    // Update order status
    const { error: updateError } = await supabaseAdmin
      .from('investment_orders')
      .update({
        token_transfer_status: 'completed',
        token_transfer_tx_hash: transferTx.hash,
        transferred_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    // Update portfolio
    const { data: existingPortfolio } = await supabaseAdmin
      .from('portfolio')
      .select('*')
      .eq('user_id', order.user_id)
      .eq('token_id', order.token_id)
      .single();

    if (existingPortfolio) {
      await supabaseAdmin
        .from('portfolio')
        .update({
          balance: parseFloat(existingPortfolio.balance) + parseFloat(order.token_quantity),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPortfolio.id);
    } else {
      await supabaseAdmin
        .from('portfolio')
        .insert({
          user_id: order.user_id,
          token_id: order.token_id,
          balance: parseFloat(order.token_quantity),
          locked_balance: 0
        });
    }

    // Update investor's current investment
    await supabaseAdmin
      .from('investor_identities')
      .update({
        current_investment: ethers.parseUnits(order.amount_inr.toString(), 0)
      })
      .eq('user_id', order.user_id);

    // Record transaction
    await supabaseAdmin.from('transactions').insert({
      transaction_type: 'investment',
      from_user_id: null, // Issuer
      to_user_id: order.user_id,
      token_id: order.token_id,
      quantity: parseFloat(order.token_quantity),
      price: parseFloat(order.price_per_token),
      total_amount: parseFloat(order.amount_inr),
      settlement_status: 'completed',
      blockchain_tx_hash: transferTx.hash
    });

    // Log audit
    await supabaseAdmin.from('audit_logs').insert({
      user_id: decoded.userId,
      action: 'tokens_transferred',
      resource_type: 'investment_order',
      resource_id: orderId,
      details: {
        txHash: transferTx.hash,
        amount: order.token_quantity,
        recipient: investorIdentity.wallet_address
      },
      severity: 'info'
    });

    // TODO: Send email notification to investor

    return NextResponse.json({
      success: true,
      message: 'Tokens transferred successfully',
      txHash: transferTx.hash,
      amount: order.token_quantity,
      recipient: investorIdentity.wallet_address
    });

  } catch (error: any) {
    console.error('Transfer tokens error:', error);
    
    // Update order status to failed
    if (supabaseAdmin) {
      const { orderId } = await request.json();
      await supabaseAdmin
        .from('investment_orders')
        .update({
          token_transfer_status: 'failed',
          notes: error.message
        })
        .eq('id', orderId);
    }

    return NextResponse.json(
      { error: error.message || 'Transfer failed' },
      { status: 500 }
    );
  }
}
