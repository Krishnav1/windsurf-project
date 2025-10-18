/**
 * 2FA Setup API Route
 * 
 * POST /api/auth/setup-2fa
 * Generates 2FA secret and QR code for user
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken, generate2FASecret } from '@/lib/utils/auth';

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

    // Get user from database
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate 2FA secret and QR code
    const { secret, qrCode } = await generate2FASecret(user.email);

    // Store secret temporarily (will be confirmed after verification)
    await supabaseAdmin
      .from('users')
      .update({
        two_fa_secret: secret,
      })
      .eq('id', user.id);

    // Log 2FA setup attempt
    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: '2fa_setup_initiated',
      resource_type: 'user',
      resource_id: user.id,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      severity: 'info',
    });

    return NextResponse.json({
      success: true,
      secret,
      qrCode,
    }, { status: 200 });

  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
