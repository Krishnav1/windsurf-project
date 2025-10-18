/**
 * Portfolio API Route
 * 
 * GET /api/portfolio
 * Returns user's token holdings and transaction history
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';

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

    // Get user's portfolio
    const { data: portfolio, error: portfolioError } = await supabaseAdmin
      .from('portfolios')
      .select(`
        *,
        tokens:token_id (
          id,
          token_symbol,
          token_name,
          asset_type,
          contract_address,
          token_id,
          mint_tx_hash,
          status,
          is_frozen
        )
      `)
      .eq('user_id', decoded.userId)
      .gt('balance', 0);

    if (portfolioError) {
      console.error('Portfolio query error:', portfolioError);
      return NextResponse.json(
        { error: 'Failed to fetch portfolio' },
        { status: 500 }
      );
    }

    // Get user's transaction history
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('transactions')
      .select(`
        *,
        tokens:token_id (
          token_symbol,
          token_name
        )
      `)
      .or(`from_user_id.eq.${decoded.userId},to_user_id.eq.${decoded.userId}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (txError) {
      console.error('Transactions query error:', txError);
    }

    // Get user's current balance
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('demo_balance')
      .eq('id', decoded.userId)
      .single();

    // Calculate portfolio value
    let totalPortfolioValue = 0;
    const portfolioWithValues = portfolio?.map(item => {
      // For prototype, use a simulated market price
      const marketPrice = 100; // Simulated price
      const value = item.balance * marketPrice;
      totalPortfolioValue += value;

      return {
        ...item,
        marketPrice,
        currentValue: value,
      };
    });

    return NextResponse.json({
      success: true,
      portfolio: portfolioWithValues || [],
      transactions: transactions || [],
      summary: {
        demoBalance: user?.demo_balance || 0,
        totalPortfolioValue,
        totalAssets: portfolio?.length || 0,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Portfolio error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
