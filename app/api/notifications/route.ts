/**
 * Notifications API
 * GET: Fetch user notifications
 * PUT: Mark as read
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
    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', decoded.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount: notifications?.filter(n => !n.read).length || 0
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const { notificationIds, markAllAsRead } = await request.json();

    if (markAllAsRead) {
      await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('user_id', decoded.userId)
        .eq('read', false);
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .in('id', notificationIds)
        .eq('user_id', decoded.userId);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
