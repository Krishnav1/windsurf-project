/**
 * 2FA Verification API Route
 * 
 * POST /api/auth/verify-2fa
 * Verifies 2FA token and enables 2FA for user
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken, verify2FAToken } from '@/lib/utils/auth';

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

    const authToken = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(authToken);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token, secret } = body;

    if (!token || !secret) {
      return NextResponse.json(
        { error: 'Token and secret are required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Verify the 2FA token
    const isValid = verify2FAToken(token, secret);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Enable 2FA for user
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        two_fa_enabled: true,
        two_fa_secret: secret,
      })
      .eq('id', decoded.userId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to enable 2FA' },
        { status: 500 }
      );
    }

    // Log 2FA enabled
    await supabaseAdmin.from('audit_logs').insert({
      user_id: decoded.userId,
      action: '2fa_enabled',
      resource_type: 'user',
      resource_id: decoded.userId,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      severity: 'info',
    });

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully',
    }, { status: 200 });

  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
