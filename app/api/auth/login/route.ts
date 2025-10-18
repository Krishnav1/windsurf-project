/**
 * User Login API Route
 * 
 * POST /api/auth/login
 * Authenticates user and returns JWT token
 * Supports optional 2FA verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyPassword, generateToken, verify2FAToken } from '@/lib/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, twoFactorToken } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      // Log failed login attempt
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'login_failed',
        resource_type: 'user',
        resource_id: user.id,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        details: { reason: 'invalid_password' },
        severity: 'warning',
      });

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if 2FA is enabled
    if (user.two_fa_enabled) {
      if (!twoFactorToken) {
        return NextResponse.json(
          { 
            error: '2FA token required',
            requires2FA: true 
          },
          { status: 403 }
        );
      }

      // Verify 2FA token
      const is2FAValid = verify2FAToken(twoFactorToken, user.two_fa_secret);
      if (!is2FAValid) {
        // Log failed 2FA attempt
        await supabaseAdmin.from('audit_logs').insert({
          user_id: user.id,
          action: 'login_failed',
          resource_type: 'user',
          resource_id: user.id,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          details: { reason: 'invalid_2fa_token' },
          severity: 'warning',
        });

        return NextResponse.json(
          { error: 'Invalid 2FA token' },
          { status: 401 }
        );
      }
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.role);

    // Log successful login
    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'login_success',
      resource_type: 'user',
      resource_id: user.id,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      details: { email: user.email },
      severity: 'info',
    });

    // Return success with token and user data
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        walletAddress: user.wallet_address,
        kycStatus: user.kyc_status,
        demoBalance: user.demo_balance,
        twoFAEnabled: user.two_fa_enabled,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
