/**
 * User Holdings API
 * Fetch and manage user token holdings
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';
import { logError } from '@/lib/utils/errorHandler';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // Fetch user holdings with token details
    const { data: holdings, error } = await supabaseAdmin
      .from('user_holdings')
      .select(`
        *,
        token:token_id (
          name,
          symbol,
          current_price,
          contract_address,
          description,
          image_url
        )
      `)
      .eq('user_id', decoded.userId)
      .order('total_invested', { ascending: false });

    if (error) {
      console.error('[Holdings API] Fetch error:', error);
      throw error;
    }

    // Calculate current values and P&L
    const enrichedHoldings = (holdings || []).map(holding => {
      const quantity = parseFloat(holding.quantity || '0');
      const avgPrice = parseFloat(holding.avg_purchase_price || '0');
      const currentPrice = parseFloat(holding.token?.current_price || avgPrice);
      const totalInvested = parseFloat(holding.total_invested || '0');
      
      const currentValue = quantity * currentPrice;
      const unrealizedPnl = currentValue - totalInvested;

      return {
        ...holding,
        current_value: currentValue.toFixed(2),
        unrealized_pnl: unrealizedPnl.toFixed(2),
        token: {
          ...holding.token,
          current_price: currentPrice.toFixed(2)
        }
      };
    });

    return NextResponse.json({
      success: true,
      holdings: enrichedHoldings,
      summary: {
        totalHoldings: enrichedHoldings.length,
        totalInvested: enrichedHoldings.reduce((sum, h) => sum + parseFloat(h.total_invested || '0'), 0),
        currentValue: enrichedHoldings.reduce((sum, h) => sum + parseFloat(h.current_value || '0'), 0),
        totalPnL: enrichedHoldings.reduce((sum, h) => sum + parseFloat(h.unrealized_pnl || '0'), 0)
      }
    });

  } catch (error) {
    console.error('[Holdings API] Error:', error);
    logError('Holdings Fetch', error as Error);
    return NextResponse.json({
      error: 'Failed to fetch holdings',
      details: (error as Error).message
    }, { status: 500 });
  }
}
