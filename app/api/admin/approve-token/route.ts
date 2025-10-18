/**
 * Admin Token Approval API Route
 * 
 * POST /api/admin/approve-token
 * Allows admins to approve token issuance requests and deploy to blockchain
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';
import { deploySecurityToken } from '@/lib/blockchain/tokenFactory';

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

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tokenId, action, rejectionReason } = body;

    if (!tokenId || !action) {
      return NextResponse.json(
        { error: 'Token ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
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

    if (tokenData.status !== 'pending') {
      return NextResponse.json(
        { error: `Token is already ${tokenData.status}` },
        { status: 400 }
      );
    }

    // Handle rejection
    if (action === 'reject') {
      const { error: updateError } = await supabaseAdmin
        .from('tokens')
        .update({
          status: 'rejected',
          freeze_reason: rejectionReason || 'Rejected by admin',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', tokenId);

      if (updateError) {
        console.error('Database update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to reject token' },
          { status: 500 }
        );
      }

      // Log rejection
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'token_rejected',
        resource_type: 'token',
        resource_id: tokenId,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        details: {
          tokenSymbol: tokenData.token_symbol,
          reason: rejectionReason,
        },
        severity: 'info',
      });

      return NextResponse.json({
        success: true,
        message: 'Token issuance request rejected',
      }, { status: 200 });
    }

    // Handle approval - Deploy to blockchain
    try {
      console.log('Deploying token to blockchain...');
      
      // Get admin wallet private key for deployment
      const deployerPrivateKey = user.wallet_private_key_encrypted;
      
      if (!deployerPrivateKey) {
        return NextResponse.json(
          { error: 'Admin wallet not configured for deployment' },
          { status: 500 }
        );
      }

      // Deploy token contract
      const deployment = await deploySecurityToken({
        name: tokenData.token_name,
        symbol: tokenData.token_symbol,
        totalSupply: tokenData.total_supply.toString(),
        decimals: tokenData.decimals,
        assetType: tokenData.asset_type,
        metadataHash: tokenData.metadata_hash,
        deployerPrivateKey,
      });

      // Update token with blockchain details
      const { error: updateError } = await supabaseAdmin
        .from('tokens')
        .update({
          status: 'active',
          contract_address: deployment.contractAddress,
          token_id: deployment.tokenId,
          mint_tx_hash: deployment.transactionHash,
          mint_timestamp: new Date().toISOString(),
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', tokenId);

      if (updateError) {
        console.error('Database update error:', updateError);
        return NextResponse.json(
          { error: 'Token deployed but failed to update database' },
          { status: 500 }
        );
      }

      // Create transaction record
      await supabaseAdmin.from('transactions').insert({
        transaction_type: 'mint',
        to_user_id: tokenData.issuer_id,
        token_id: tokenId,
        quantity: tokenData.total_supply,
        settlement_method: 'demo',
        settlement_status: 'completed',
        blockchain_tx_hash: deployment.transactionHash,
        block_number: deployment.blockNumber,
        metadata: {
          contractAddress: deployment.contractAddress,
          tokenId: deployment.tokenId,
        },
      });

      // Log approval and deployment
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'token_approved_and_deployed',
        resource_type: 'token',
        resource_id: tokenId,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        details: {
          tokenSymbol: tokenData.token_symbol,
          contractAddress: deployment.contractAddress,
          transactionHash: deployment.transactionHash,
        },
        severity: 'info',
      });

      return NextResponse.json({
        success: true,
        message: 'Token approved and deployed to blockchain',
        deployment: {
          contractAddress: deployment.contractAddress,
          transactionHash: deployment.transactionHash,
          blockNumber: deployment.blockNumber,
          tokenId: deployment.tokenId,
        },
      }, { status: 200 });

    } catch (deploymentError: any) {
      console.error('Blockchain deployment error:', deploymentError);
      
      // Log deployment failure
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'token_deployment_failed',
        resource_type: 'token',
        resource_id: tokenId,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        details: {
          tokenSymbol: tokenData.token_symbol,
          error: deploymentError.message,
        },
        severity: 'critical',
      });

      return NextResponse.json(
        { 
          error: 'Failed to deploy token to blockchain',
          details: deploymentError.message 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Token approval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
