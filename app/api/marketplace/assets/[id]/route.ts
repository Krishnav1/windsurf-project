/**
 * Asset Detail API
 * Get complete asset information
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get asset with all related data
    const { data: asset, error } = await supabaseAdmin
      .from('tokens')
      .select(`
        *,
        asset_details(*),
        asset_media(
          id,
          media_type,
          file_url,
          thumbnail_url,
          display_order,
          is_primary,
          caption
        ),
        asset_documents(
          id,
          document_type,
          document_name,
          file_url,
          file_size,
          uploaded_at,
          is_public
        ),
        issuer_profiles:users!tokens_issuer_id_fkey(
          id,
          full_name,
          issuer_profiles(
            company_name,
            rating,
            verified,
            bio,
            logo_url,
            website,
            total_assets_issued,
            total_funds_raised,
            success_rate
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Calculate available tokens
    const { data: orders } = await supabaseAdmin
      .from('investment_orders')
      .select('token_quantity')
      .eq('token_id', id)
      .eq('token_transfer_status', 'completed');

    const soldTokens = orders?.reduce((sum, o) => sum + parseFloat(o.token_quantity), 0) || 0;
    const availableTokens = parseFloat(asset.total_supply) - soldTokens;

    // Get investment stats
    const { data: investments } = await supabaseAdmin
      .from('investment_orders')
      .select('amount_inr, user_id')
      .eq('token_id', id)
      .eq('token_transfer_status', 'completed');

    const totalRaised = investments?.reduce((sum, i) => sum + parseFloat(i.amount_inr), 0) || 0;
    const uniqueInvestors = new Set(investments?.map(i => i.user_id)).size;

    // Format response
    const details = asset.asset_details;
    const issuerProfile = asset.issuer_profiles?.issuer_profiles;

    const formattedAsset = {
      id: asset.id,
      name: asset.token_name,
      symbol: asset.token_symbol,
      assetType: asset.asset_type,
      description: asset.asset_description,
      totalValuation: asset.asset_valuation,
      totalSupply: asset.total_supply,
      availableTokens,
      soldTokens,
      pricePerToken: asset.asset_valuation / asset.total_supply,
      contractAddress: asset.contract_address,
      status: asset.status,
      createdAt: asset.created_at,
      
      // Asset details
      details: details ? {
        propertyType: details.property_type,
        address: {
          line1: details.address_line1,
          line2: details.address_line2,
          city: details.city,
          state: details.state,
          pincode: details.pincode,
          country: details.country
        },
        location: {
          latitude: details.latitude,
          longitude: details.longitude
        },
        area: details.area_sqft,
        constructionYear: details.construction_year,
        occupancyStatus: details.occupancy_status,
        rentalIncome: details.rental_income,
        propertyTax: details.property_tax,
        maintenanceCharges: details.maintenance_charges,
        amenities: details.amenities,
        expectedReturns: details.expected_returns_percent,
        lockInMonths: details.lock_in_months,
        distributionFrequency: details.distribution_frequency,
        minInvestment: details.min_investment,
        maxInvestment: details.max_investment,
        floorPlanUrl: details.floor_plan_url
      } : null,

      // Media
      media: {
        images: asset.asset_media?.filter(m => m.media_type === 'image')
          .sort((a, b) => a.display_order - b.display_order) || [],
        videos: asset.asset_media?.filter(m => m.media_type === 'video') || [],
        virtualTour: asset.asset_media?.find(m => m.media_type === 'virtual_tour')?.file_url
      },

      // Documents
      documents: asset.asset_documents?.filter(d => d.is_public) || [],

      // Issuer
      issuer: issuerProfile ? {
        id: asset.issuer_profiles.id,
        name: issuerProfile.company_name || asset.issuer_profiles.full_name,
        rating: issuerProfile.rating,
        verified: issuerProfile.verified,
        bio: issuerProfile.bio,
        logoUrl: issuerProfile.logo_url,
        website: issuerProfile.website,
        totalAssets: issuerProfile.total_assets_issued,
        totalFundsRaised: issuerProfile.total_funds_raised,
        successRate: issuerProfile.success_rate
      } : null,

      // Investment stats
      stats: {
        totalRaised,
        uniqueInvestors,
        fundingProgress: (totalRaised / asset.asset_valuation) * 100
      }
    };

    return NextResponse.json({
      success: true,
      asset: formattedAsset
    });

  } catch (error: any) {
    console.error('Asset detail error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
