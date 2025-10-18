/**
 * 2FA Disable API Route
 * 
 * POST /api/auth/disable-2fa
 * Disables 2FA for user
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Disable 2FA for user
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        two_fa_enabled: false,
        two_fa_secret: null,
      })
      .eq('id', decoded.userId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to disable 2FA' },
        { status: 500 }
      );
    }

    // Log 2FA disabled
    await supabaseAdmin.from('audit_logs').insert({
      user_id: decoded.userId,
      action: '2fa_disabled',
      resource_type: 'user',
      resource_id: decoded.userId,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      severity: 'warning',
    });

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully',
    }, { status: 200 });

  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
