/**
 * Save Wallet Address API
 * Saves user's wallet address to their profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Validate wallet address format (basic check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 });
    }

    // Check if wallet is already used by another user
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('wallet_address', walletAddress.toLowerCase())
      .neq('id', decoded.userId)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'This wallet address is already linked to another account' },
        { status: 400 }
      );
    }

    // Update user's wallet address
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ wallet_address: walletAddress.toLowerCase() })
      .eq('id', decoded.userId);

    if (updateError) {
      throw updateError;
    }

    // Log audit
    await supabaseAdmin.from('audit_logs').insert({
      user_id: decoded.userId,
      action: 'wallet_connected',
      resource_type: 'user',
      resource_id: decoded.userId,
      details: { walletAddress: walletAddress.toLowerCase() },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      severity: 'info'
    });

    return NextResponse.json({
      success: true,
      message: 'Wallet address saved successfully',
      walletAddress: walletAddress.toLowerCase()
    });

  } catch (error: any) {
    console.error('Save wallet address error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
