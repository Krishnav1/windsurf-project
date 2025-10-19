/**
 * Admin Deploy Token API
 * Deploys approved tokens to blockchain
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';
import { ethers } from 'ethers';
import { getProvider, getWallet } from '@/lib/blockchain/config';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
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

    // Verify admin role
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get request body
    const { tokenId } = await request.json();

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
    }

    // Get token from database
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('tokens')
      .select('*')
      .eq('id', tokenId)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Check if already deployed
    if (tokenData.contract_address) {
      return NextResponse.json({ 
        error: 'Token already deployed',
        contractAddress: tokenData.contract_address 
      }, { status: 400 });
    }

    // Check if token is approved
    if (tokenData.status !== 'approved') {
      return NextResponse.json({ 
        error: 'Token must be approved before deployment' 
      }, { status: 400 });
    }

    // Deploy contracts
    const provider = getProvider();
    const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
    
    if (!deployerPrivateKey) {
      return NextResponse.json({ error: 'Deployer key not configured' }, { status: 500 });
    }

    const wallet = new ethers.Wallet(deployerPrivateKey, provider);

    // Load contract ABIs
    const ERC3643TokenABI = require('@/lib/blockchain/abis/ERC3643Token.json');
    const IdentityRegistryABI = require('@/lib/blockchain/abis/IdentityRegistry.json');
    const ComplianceManagerABI = require('@/lib/blockchain/abis/ComplianceManager.json');

    // Deploy Identity Registry
    const IdentityRegistryFactory = new ethers.ContractFactory(
      IdentityRegistryABI.abi,
      IdentityRegistryABI.bytecode,
      wallet
    );
    const identityRegistry = await IdentityRegistryFactory.deploy();
    await identityRegistry.waitForDeployment();
    const identityRegistryAddress = await identityRegistry.getAddress();

    // Deploy Compliance Manager
    const ComplianceFactory = new ethers.ContractFactory(
      ComplianceManagerABI.abi,
      ComplianceManagerABI.bytecode,
      wallet
    );
    const complianceManager = await ComplianceFactory.deploy();
    await complianceManager.waitForDeployment();
    const complianceAddress = await complianceManager.getAddress();

    // Deploy ERC3643 Token
    const TokenFactory = new ethers.ContractFactory(
      ERC3643TokenABI.abi,
      ERC3643TokenABI.bytecode,
      wallet
    );
    
    const erc3643Token = await TokenFactory.deploy(
      tokenData.token_name,
      tokenData.token_symbol,
      identityRegistryAddress,
      complianceAddress
    );
    await erc3643Token.waitForDeployment();
    const tokenAddress = await erc3643Token.getAddress();

    // Mint initial supply to deployer
    const mintTx = await erc3643Token.mint(
      wallet.address,
      ethers.parseUnits(tokenData.total_supply.toString(), tokenData.decimals || 8)
    );
    await mintTx.wait();

    // Update database
    const { error: updateError } = await supabaseAdmin
      .from('tokens')
      .update({
        contract_address: tokenAddress,
        identity_registry_address: identityRegistryAddress,
        compliance_address: complianceAddress,
        status: 'active',
        mint_tx_hash: mintTx.hash,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenId);

    if (updateError) {
      console.error('Database update error:', updateError);
    }

    // Log deployment
    await supabaseAdmin.from('audit_logs').insert({
      user_id: decoded.userId,
      action: 'token_deployed',
      resource_type: 'token',
      resource_id: tokenId,
      details: {
        tokenAddress,
        identityRegistryAddress,
        complianceAddress,
        initialSupply: tokenData.total_supply,
        mintTxHash: mintTx.hash
      },
      severity: 'info'
    });

    return NextResponse.json({
      success: true,
      message: 'Token deployed successfully',
      contractAddress: tokenAddress,
      identityRegistryAddress,
      complianceAddress,
      mintTxHash: mintTx.hash
    });

  } catch (error: any) {
    console.error('Deploy token error:', error);
    return NextResponse.json(
      { error: error.message || 'Deployment failed' },
      { status: 500 }
    );
  }
}
