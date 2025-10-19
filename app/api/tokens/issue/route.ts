/**
 * Token Issuance API Route
 * 
 * POST /api/tokens/issue
 * Handles token issuance requests from asset issuers
 * Computes metadata hash and stores issuance request for admin approval
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';
import { computeMetadataHash, sha256Buffer, generateAssetUID } from '@/lib/utils/hash';

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

    // Check if supabaseAdmin is available
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

    // Check if user is issuer or admin
    if (user.role !== 'issuer' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only issuers can create token issuance requests' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    
    const tokenName = formData.get('tokenName') as string;
    const tokenSymbol = formData.get('tokenSymbol') as string;
    const assetType = formData.get('assetType') as string;
    const totalSupply = formData.get('totalSupply') as string;
    const assetDescription = formData.get('assetDescription') as string;
    const assetValuation = formData.get('assetValuation') as string;
    const valuationDate = formData.get('valuationDate') as string;
    const custodianName = formData.get('custodianName') as string;
    const issuerLegalName = formData.get('issuerLegalName') as string;
    const issuerRegistrationNumber = formData.get('issuerRegistrationNumber') as string;

    // Validate required fields
    if (!tokenName || !tokenSymbol || !assetType || !totalSupply || !issuerLegalName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate token symbol format (uppercase, alphanumeric, 3-10 chars)
    const symbolRegex = /^[A-Z0-9]{3,10}$/;
    if (!symbolRegex.test(tokenSymbol)) {
      return NextResponse.json(
        { error: 'Token symbol must be 3-10 uppercase alphanumeric characters' },
        { status: 400 }
      );
    }

    // Check if token symbol already exists
    const { data: existingToken } = await supabaseAdmin
      .from('tokens')
      .select('id')
      .eq('token_symbol', tokenSymbol)
      .single();

    if (existingToken) {
      return NextResponse.json(
        { error: 'Token symbol already exists' },
        { status: 409 }
      );
    }

    // Process uploaded documents and compute hashes
    const legalDoc = formData.get('legalDocument') as File | null;
    const valuationReport = formData.get('valuationReport') as File | null;
    const custodyProof = formData.get('custodyProof') as File | null;

    let legalDocHash = '';
    let valuationReportHash = '';
    let custodyProofHash = '';

    // Compute document hashes
    if (legalDoc) {
      const buffer = Buffer.from(await legalDoc.arrayBuffer());
      legalDocHash = sha256Buffer(buffer);
    }

    if (valuationReport) {
      const buffer = Buffer.from(await valuationReport.arrayBuffer());
      valuationReportHash = sha256Buffer(buffer);
    }

    if (custodyProof) {
      const buffer = Buffer.from(await custodyProof.arrayBuffer());
      custodyProofHash = sha256Buffer(buffer);
    }

    // Generate unique asset UID
    const assetUID = generateAssetUID(issuerLegalName, assetType);

    // Compute metadata hash for on-chain anchoring
    const metadataHash = computeMetadataHash({
      issuerLegalName,
      assetType,
      assetUID,
      valuationDate: valuationDate || new Date().toISOString().split('T')[0],
      valuationAmount: parseFloat(assetValuation) || 0,
      custodianName: custodianName || '',
      custodyProofID: custodyProofHash || '',
      timestamp: new Date().toISOString(),
    });

    // Store token issuance request in database
    const { data: newToken, error: insertError } = await supabaseAdmin
      .from('tokens')
      .insert({
        token_symbol: tokenSymbol,
        token_name: tokenName,
        asset_type: assetType,
        total_supply: parseFloat(totalSupply),
        decimals: 8, // Standard for fractional assets
        issuer_id: user.id,
        issuer_legal_name: issuerLegalName,
        issuer_registration_number: issuerRegistrationNumber || null,
        asset_description: assetDescription || null,
        asset_valuation: assetValuation ? parseFloat(assetValuation) : null,
        asset_valuation_date: valuationDate || null,
        custodian_name: custodianName || null,
        custody_proof_hash: custodyProofHash || null,
        legal_doc_hash: legalDocHash || null,
        valuation_report_hash: valuationReportHash || null,
        metadata_hash: metadataHash,
        status: 'pending', // Requires admin approval
        chain_id: 80002, // Polygon Amoy
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create token issuance request' },
        { status: 500 }
      );
    }

    // Log issuance request in audit logs
    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'token_issuance_requested',
      resource_type: 'token',
      resource_id: newToken.id,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      details: {
        tokenSymbol,
        tokenName,
        assetType,
        totalSupply,
        metadataHash,
      },
      severity: 'info',
    });

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Token issuance request submitted successfully. Awaiting admin approval.',
      token: {
        id: newToken.id,
        tokenSymbol: newToken.token_symbol,
        tokenName: newToken.token_name,
        assetType: newToken.asset_type,
        totalSupply: newToken.total_supply,
        metadataHash: newToken.metadata_hash,
        status: newToken.status,
        legalDocHash: legalDocHash || null,
        valuationReportHash: valuationReportHash || null,
        custodyProofHash: custodyProofHash || null,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Token issuance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tokens/issue
 * Get all token issuance requests (admin only)
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

    // Get tokens based on user role
    let query = supabaseAdmin.from('tokens').select('*');

    if (user.role === 'issuer') {
      // Issuers can only see their own tokens
      query = query.eq('issuer_id', user.id);
    } else if (user.role !== 'admin' && user.role !== 'auditor') {
      // Regular users can only see approved/active tokens
      query = query.in('status', ['approved', 'active']);
    }

    const { data: tokens, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tokens' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tokens,
    }, { status: 200 });

  } catch (error) {
    console.error('Get tokens error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
