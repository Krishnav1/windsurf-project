import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    let userId = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.userId;
      } catch (e) {
        // Token invalid, continue without userId
      }
    }

    const supabase = await createClient();

    // Fetch asset details
    const { data: asset, error } = await supabase
      .from('tokens')
      .select(`
        *,
        users!tokens_issuer_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('id', params.id)
      .single();

    if (error || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Get user's holding if authenticated
    let userHolding = 0;
    if (userId) {
      const { data: portfolio } = await supabase
        .from('portfolio')
        .select('balance')
        .eq('user_id', userId)
        .eq('token_id', params.id)
        .single();

      userHolding = portfolio?.balance || 0;
    }

    // Calculate available tokens
    const { data: portfolios } = await supabase
      .from('portfolio')
      .select('balance')
      .eq('token_id', params.id);

    const soldTokens = portfolios?.reduce((sum, p) => sum + (p.balance || 0), 0) || 0;
    const availableTokens = (asset.total_supply || 0) - soldTokens;

    // Format response
    const assetDetail = {
      id: asset.id,
      name: asset.token_name,
      symbol: asset.token_symbol,
      assetType: asset.asset_type,
      status: asset.status,
      totalValuation: asset.total_valuation || 0,
      totalSupply: asset.total_supply || 0,
      pricePerToken: asset.price_per_token || 0,
      availableTokens,
      soldTokens,
      primaryImage: asset.primary_image,
      images: asset.images || [],
      location: asset.location,
      area: asset.area,
      expectedReturns: asset.expected_returns,
      rentalYield: asset.rental_yield,
      lockInMonths: asset.lock_in_months,
      minInvestment: asset.min_investment,
      description: asset.asset_description,
      highlights: asset.highlights || [],
      specifications: asset.specifications || {},
      documents: asset.documents || [],
      issuer: {
        id: asset.users?.id,
        name: asset.users?.full_name || 'Unknown',
        rating: 4.5,
        verified: true,
      },
      userHolding,
      createdAt: asset.created_at,
    };

    return NextResponse.json({ success: true, asset: assetDetail });
  } catch (error: any) {
    console.error('Fetch asset error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
