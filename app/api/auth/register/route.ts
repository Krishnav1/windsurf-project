/**
 * User Registration API Route
 * 
 * POST /api/auth/register
 * Handles new user registration with password hashing and wallet generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { hashPassword, validatePasswordStrength } from '@/lib/utils/auth';
import { getWallet } from '@/lib/blockchain/config';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, mobile, country, role } = body;

    // Validate required fields
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.message },
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

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate custodial wallet for user (testnet)
    const wallet = getWallet();
    const walletAddress = wallet.address;
    
    // In production, encrypt private key with user-specific key
    // For prototype, we store encrypted with a master key
    const walletPrivateKeyEncrypted = wallet.privateKey; // TODO: Implement proper encryption

    // Validate role
    const validRoles = ['investor', 'issuer', 'admin', 'auditor'];
    const userRole = role && validRoles.includes(role) ? role : 'investor';

    // Insert user into database
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: fullName,
        mobile: mobile || null,
        country: country || 'India',
        role: userRole,
        wallet_address: walletAddress,
        wallet_private_key_encrypted: walletPrivateKeyEncrypted,
        kyc_status: 'pending',
        demo_balance: 100000.00, // Demo balance for testing
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Log registration in audit logs
    await supabaseAdmin.from('audit_logs').insert({
      user_id: newUser.id,
      action: 'user_registered',
      resource_type: 'user',
      resource_id: newUser.id,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      details: { email: email.toLowerCase(), role: userRole },
      severity: 'info',
    });

    // Return success (don't send sensitive data)
    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
        walletAddress: newUser.wallet_address,
        kycStatus: newUser.kyc_status,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
