/**
 * Admin Audit Logs API
 * GET: Retrieve audit logs with filtering
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

    // Verify admin role
    const { data: admin } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .single();

    if (admin?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || '';
    const severity = searchParams.get('severity') || '';
    const userId = searchParams.get('userId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build query - try audit_logs_enhanced first, fallback to audit_logs
    let query = supabaseAdmin
      .from('audit_logs_enhanced')
      .select(`
        *,
        users!audit_logs_enhanced_user_id_fkey (
          id,
          email,
          full_name
        )
      `, { count: 'exact' });

    // Apply filters
    if (action) {
      query = query.ilike('action', `%${action}%`);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    // If audit_logs_enhanced doesn't exist, try audit_logs
    if (error && error.message?.includes('does not exist')) {
      let fallbackQuery = supabaseAdmin
        .from('audit_logs')
        .select('*', { count: 'exact' });

      if (action) fallbackQuery = fallbackQuery.ilike('action', `%${action}%`);
      if (severity) fallbackQuery = fallbackQuery.eq('severity', severity);
      if (userId) fallbackQuery = fallbackQuery.eq('user_id', userId);
      if (startDate) fallbackQuery = fallbackQuery.gte('created_at', startDate);
      if (endDate) fallbackQuery = fallbackQuery.lte('created_at', endDate);

      fallbackQuery = fallbackQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: fallbackLogs, error: fallbackError, count: fallbackCount } = await fallbackQuery;

      if (fallbackError) {
        throw fallbackError;
      }

      return NextResponse.json({
        success: true,
        logs: fallbackLogs || [],
        pagination: {
          page,
          limit,
          total: fallbackCount || 0,
          totalPages: Math.ceil((fallbackCount || 0) / limit)
        }
      });
    }

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('Get audit logs error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
