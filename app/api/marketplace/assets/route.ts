/**
 * Marketplace Assets API
 * Get all active assets with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const assetType = searchParams.get('assetType');
    const city = searchParams.get('city');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minReturns = searchParams.get('minReturns');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Build query - Show active, approved, and pending assets (public marketplace)
    let query = supabaseAdmin
      .from('tokens')
      .select(`
        *,
        asset_details(*),
        asset_media(file_url, media_type, is_primary),
        users!tokens_issuer_id_fkey(
          id,
          full_name,
          issuer_profiles(
            company_name,
            rating,
            verified
          )
        )
      `, { count: 'exact' })
      .in('status', ['active', 'approved', 'pending']);

    // Apply filters
    if (assetType && assetType !== 'all') {
      query = query.eq('asset_type', assetType);
    }

    if (city) {
      query = query.eq('asset_details.city', city);
    }

    if (minPrice) {
      query = query.gte('asset_valuation', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('asset_valuation', parseFloat(maxPrice));
    }

    if (minReturns) {
      query = query.gte('asset_details.expected_returns_percent', parseFloat(minReturns));
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    
    if (sortBy === 'price') {
      query = query.order('asset_valuation', { ascending });
    } else if (sortBy === 'returns') {
      query = query.order('asset_details.expected_returns_percent', { ascending: !ascending });
    } else {
      query = query.order(sortBy, { ascending });
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: assets, error, count } = await query;

    if (error) {
      console.error('Fetch assets error:', error);
      return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
    }

    // Format response
    const formattedAssets = assets?.map(asset => {
      const details = asset.asset_details;
      const primaryImage = asset.asset_media?.find((m: any) => m.is_primary)?.file_url 
        || asset.asset_media?.[0]?.file_url;
      
      return {
        id: asset.id,
        name: asset.token_name,
        symbol: asset.token_symbol,
        assetType: asset.asset_type,
        status: asset.status,
        totalValuation: asset.asset_valuation,
        totalSupply: asset.total_supply,
        pricePerToken: asset.asset_valuation / asset.total_supply,
        contractAddress: asset.contract_address,
        primaryImage,
        location: details ? `${details.city}, ${details.state}` : null,
        area: details?.area_sqft,
        expectedReturns: details?.expected_returns_percent,
        lockInMonths: details?.lock_in_months,
        minInvestment: details?.min_investment,
        maxInvestment: details?.max_investment,
        issuer: {
          name: asset.users?.issuer_profiles?.company_name || asset.users?.full_name,
          rating: asset.users?.issuer_profiles?.rating,
          verified: asset.users?.issuer_profiles?.verified
        },
        createdAt: asset.created_at
      };
    });

    return NextResponse.json({
      success: true,
      assets: formattedAssets,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('Marketplace error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
