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
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;

    const supabase = await createClient();

    const { data } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .eq('token_id', params.id)
      .single();

    return NextResponse.json({ isInWatchlist: !!data });
  } catch (error: any) {
    console.error('Check watchlist error:', error);
    return NextResponse.json({ isInWatchlist: false });
  }
}
