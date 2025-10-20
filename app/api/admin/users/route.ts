/**
 * Admin Users Management API
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
    const role = searchParams.get('role') || 'all';
    const kycStatus = searchParams.get('kycStatus') || 'all';
    const search = searchParams.get('search') || '';

    // Build query
    let query = supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (role !== 'all') {
      query = query.eq('role', role);
    }

    if (kycStatus !== 'all') {
      query = query.eq('kyc_status', kycStatus);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      users: users || []
    });

  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
