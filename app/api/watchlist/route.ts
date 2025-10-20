import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;

    const supabase = await createClient();

    const { data: watchlist, error } = await supabase
      .from('watchlist')
      .select(`
        *,
        tokens (
          id,
          token_name,
          token_symbol,
          asset_type,
          total_supply,
          price_per_token,
          expected_returns,
          primary_image,
          status
        )
      `)
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, watchlist: watchlist || [] });
  } catch (error: any) {
    console.error('Fetch watchlist error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
