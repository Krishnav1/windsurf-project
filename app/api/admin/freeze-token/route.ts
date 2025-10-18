/**
 * Token Freeze/Unfreeze API Route
 * 
 * POST /api/admin/freeze-token
 * Allows admins to freeze or unfreeze tokens for compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';
import { freezeAccount, unfreezeAccount } from '@/lib/blockchain/tokenFactory';

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

    // Get admin user
    const { data: admin } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tokenId, action, reason, userAddress } = body;

    if (!tokenId || !action) {
      return NextResponse.json(
        { error: 'Token ID and action are required' },
        { status: 400 }
      );
    }

    if (!['freeze', 'unfreeze'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "freeze" or "unfreeze"' },
        { status: 400 }
      );
    }

    // Get token from database
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

    if (!tokenData.contract_address) {
      return NextResponse.json(
        { error: 'Token not deployed to blockchain yet' },
        { status: 400 }
      );
    }

    // Update token freeze status in database
    const isFrozen = action === 'freeze';
    const { error: updateError } = await supabaseAdmin
      .from('tokens')
      .update({
        is_frozen: isFrozen,
        freeze_reason: isFrozen ? reason : null,
      })
      .eq('id', tokenId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update token status' },
        { status: 500 }
      );
    }

    // If userAddress provided, freeze/unfreeze specific account on blockchain
    let blockchainTxHash = null;
    if (userAddress && tokenData.contract_address) {
      try {
        const adminPrivateKey = admin.wallet_private_key_encrypted;
        
        if (action === 'freeze') {
          blockchainTxHash = await freezeAccount(
            tokenData.contract_address,
            userAddress,
            reason || 'Compliance review',
            adminPrivateKey
          );
        } else {
          blockchainTxHash = await unfreezeAccount(
            tokenData.contract_address,
            userAddress,
            adminPrivateKey
          );
        }
      } catch (blockchainError: any) {
        console.error('Blockchain operation error:', blockchainError);
        // Continue even if blockchain operation fails (database is updated)
      }
    }

    // Create transaction record
    await supabaseAdmin.from('transactions').insert({
      transaction_type: action === 'freeze' ? 'freeze' : 'unfreeze',
      token_id: tokenId,
      settlement_method: 'demo',
      settlement_status: 'completed',
      blockchain_tx_hash: blockchainTxHash,
      metadata: {
        reason,
        userAddress,
        adminId: admin.id,
      },
    });

    // Log freeze/unfreeze action
    await supabaseAdmin.from('audit_logs').insert({
      user_id: admin.id,
      action: `token_${action}d`,
      resource_type: 'token',
      resource_id: tokenId,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      details: {
        tokenSymbol: tokenData.token_symbol,
        reason,
        userAddress,
        blockchainTxHash,
      },
      severity: 'warning',
    });

    return NextResponse.json({
      success: true,
      message: `Token ${action}d successfully`,
      blockchainTxHash,
    }, { status: 200 });

  } catch (error) {
    console.error('Token freeze error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
