/**
 * Admin Tokens Management API
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';

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

    const { data: admin } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .single();

    if (admin?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    // Build query
    let query = supabaseAdmin
      .from('tokens')
      .select('*')
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`token_name.ilike.%${search}%,token_symbol.ilike.%${search}%`);
    }

    const { data: tokens, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      tokens: tokens || []
    });

  } catch (error: any) {
    console.error('Get tokens error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
