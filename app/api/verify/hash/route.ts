/**
 * Hash Verification API Route
 * 
 * POST /api/verify/hash
 * Verifies document hash against on-chain metadata hash
 * Public endpoint for transparency and audit
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { sha256Buffer } from '@/lib/utils/hash';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const tokenId = formData.get('tokenId') as string;
    const document = formData.get('document') as File | null;

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      );
    }

    if (!document) {
      return NextResponse.json(
        { error: 'Document file is required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Get token from database
    const { data: token, error: tokenError } = await supabaseAdmin
      .from('tokens')
      .select('*')
      .eq('id', tokenId)
      .single();

    if (tokenError || !token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    // Compute hash of uploaded document
    const buffer = Buffer.from(await document.arrayBuffer());
    const computedHash = sha256Buffer(buffer);

    // Check against stored hashes
    const matches = {
      legalDocument: token.legal_doc_hash === computedHash,
      valuationReport: token.valuation_report_hash === computedHash,
      custodyProof: token.custody_proof_hash === computedHash,
    };

    const isVerified = matches.legalDocument || matches.valuationReport || matches.custodyProof;

    // Log verification attempt
    await supabaseAdmin.from('audit_logs').insert({
      action: 'hash_verification',
      resource_type: 'token',
      resource_id: tokenId,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      details: {
        tokenSymbol: token.token_symbol,
        computedHash,
        isVerified,
        matches,
      },
      severity: 'info',
    });

    return NextResponse.json({
      success: true,
      verified: isVerified,
      computedHash,
      matches,
      token: {
        symbol: token.token_symbol,
        name: token.token_name,
        metadataHash: token.metadata_hash,
        contractAddress: token.contract_address,
        mintTxHash: token.mint_tx_hash,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Hash verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/verify/hash?tokenId=xxx
 * Get token verification details (public)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Get token public information
    const { data: token, error: tokenError } = await supabaseAdmin
      .from('tokens')
      .select(`
        id,
        token_symbol,
        token_name,
        asset_type,
        total_supply,
        metadata_hash,
        contract_address,
        token_id,
        mint_tx_hash,
        mint_timestamp,
        status,
        legal_doc_hash,
        valuation_report_hash,
        custody_proof_hash
      `)
      .eq('id', tokenId)
      .single();

    if (tokenError || !token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      token: {
        id: token.id,
        symbol: token.token_symbol,
        name: token.token_name,
        assetType: token.asset_type,
        totalSupply: token.total_supply,
        metadataHash: token.metadata_hash,
        contractAddress: token.contract_address,
        tokenId: token.token_id,
        mintTxHash: token.mint_tx_hash,
        mintTimestamp: token.mint_timestamp,
        status: token.status,
        documentHashes: {
          legalDocument: token.legal_doc_hash,
          valuationReport: token.valuation_report_hash,
          custodyProof: token.custody_proof_hash,
        },
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Get token verification details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
