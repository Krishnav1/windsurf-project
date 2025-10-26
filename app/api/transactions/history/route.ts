/**
 * Transaction History API
 * Fetch blockchain transactions for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/auth/jwt';
import { SupabaseCacheService } from '@/lib/cache/supabaseCache';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Try cache first
    const cacheKey = `transactions:${decoded.userId}`;
    const cached = await SupabaseCacheService.get(cacheKey);
    
    if (cached) {
      return NextResponse.json({
        success: true,
        transactions: cached,
        cached: true
      });
    }

    // Fetch from database
    const { data: transactions, error } = await supabaseAdmin
      .from('blockchain_transactions')
      .select('*')
      .eq('user_id', decoded.userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[Transactions API] Error fetching transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Cache for 5 minutes
    await SupabaseCacheService.set(cacheKey, transactions, 300);

    return NextResponse.json({
      success: true,
      transactions: transactions || []
    });

  } catch (error) {
    console.error('[Transactions API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
