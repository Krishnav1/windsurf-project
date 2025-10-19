/**
 * Admin Frozen Tokens List API
 * Get list of all frozen tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // TODO: Verify admin from JWT - skipping for development

    // Verify admin
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    if (!userData.user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all frozen tokens
    const { data: frozenTokens, error } = await supabaseAdmin
      .from('frozen_tokens_log')
      .select('*')
      .eq('status', 'frozen')
      .order('frozen_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      frozenTokens: frozenTokens || []
    });

  } catch (error: any) {
    console.error('Frozen tokens list error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
