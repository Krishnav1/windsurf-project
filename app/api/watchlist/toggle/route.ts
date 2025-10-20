import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;

    const { assetId } = await request.json();

    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if already in watchlist
    const { data: existing } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .eq('token_id', assetId)
      .single();

    if (existing) {
      // Remove from watchlist
      await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('token_id', assetId);

      return NextResponse.json({ success: true, isInWatchlist: false });
    } else {
      // Add to watchlist
      await supabase
        .from('watchlist')
        .insert({
          user_id: userId,
          token_id: assetId,
          added_at: new Date().toISOString(),
        });

      return NextResponse.json({ success: true, isInWatchlist: true });
    }
  } catch (error: any) {
    console.error('Watchlist toggle error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
