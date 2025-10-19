/**
 * Admin KYC Approval API
 * Approves KYC and creates investor identity for ERC-3643
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/auth';
import { sendNotification } from '@/lib/notifications/notificationService';

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

    // Verify admin
    const { data: admin } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .single();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, category, walletAddress, action } = await request.json();

    if (!userId || !category || !walletAddress) {
      return NextResponse.json(
        { error: 'userId, category, and walletAddress required' },
        { status: 400 }
      );
    }

    // Get user details
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'approve') {
      // Set investment limits based on category (IFSCA compliant)
      const investmentLimits = {
        retail: 200000,        // ₹2 Lakh (IFSCA retail limit)
        accredited: 5000000,   // ₹50 Lakh (IFSCA accredited limit)
        institutional: 999999999999, // Unlimited for institutions
        founder: 999999999999     // Unlimited for founders
      };

      const limit = investmentLimits[category as keyof typeof investmentLimits] || 200000;
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year from now

      // Update user KYC status
      await supabaseAdmin
        .from('users')
        .update({
          kyc_status: 'approved',
          cbdc_balance: user.cbdc_balance || 50000 // Set default CBDC balance if not set
        })
        .eq('id', userId);

      // Create or update investor identity in database
      const { data: existingIdentity } = await supabaseAdmin
        .from('investor_identities')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingIdentity) {
        // Update existing
        await supabaseAdmin
          .from('investor_identities')
          .update({
            wallet_address: walletAddress.toLowerCase(),
            kyc_status: 'approved',
            investor_category: category,
            investment_limit: limit,
            verified_at: new Date().toISOString(),
            expires_at: expiryDate.toISOString(),
            verified_by: decoded.userId
          })
          .eq('user_id', userId);
      } else {
        // Create new
        await supabaseAdmin
          .from('investor_identities')
          .insert({
            user_id: userId,
            wallet_address: walletAddress.toLowerCase(),
            kyc_status: 'approved',
            investor_category: category,
            country: 'India',
            investment_limit: limit,
            current_investment: 0,
            verified_at: new Date().toISOString(),
            expires_at: expiryDate.toISOString(),
            verified_by: decoded.userId
          });
      }

      // Register identity on blockchain (if wallet address provided)
      let blockchainTxHash = null;
      if (walletAddress) {
        try {
          // Note: This would be called from admin's wallet
          // In production, use a backend service with admin private key
          // For now, we'll log it and handle via admin UI
          
          // Create identity hash from KYC documents
          const pan = user.kyc_documents?.pan || 'DEMO_PAN';
          const aadhaar = user.kyc_documents?.aadhaar || 'DEMO_AADHAAR';
          
          // Log blockchain registration intent
          await supabaseAdmin.from('audit_logs').insert({
            user_id: decoded.userId,
            action: 'blockchain_identity_registration_pending',
            resource_type: 'identity_registry',
            resource_id: walletAddress,
            details: {
              userId,
              category,
              expiryDate: expiryDate.toISOString(),
              note: 'Admin needs to register identity on blockchain via admin panel'
            },
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
            severity: 'info'
          });
        } catch (blockchainError: any) {
          console.error('Blockchain registration error:', blockchainError);
          // Don't fail KYC approval if blockchain registration fails
          // Admin can retry later
        }
      }

      // Log audit
      await supabaseAdmin.from('audit_logs').insert({
        user_id: decoded.userId,
        action: 'kyc_approved',
        resource_type: 'user',
        resource_id: userId,
        details: {
          category,
          investmentLimit: limit,
          expiresAt: expiryDate.toISOString(),
          walletAddress
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        severity: 'info'
      });

      // Send notification
      await sendNotification(userId, 'kyc_approved', {
        category,
        limit
      });

      return NextResponse.json({
        success: true,
        message: 'KYC approved and investor identity created',
        investorCategory: category,
        investmentLimit: limit,
        expiresAt: expiryDate.toISOString()
      });

    } else if (action === 'reject') {
      const { reason } = await request.json();

      // Update user KYC status
      await supabaseAdmin
        .from('users')
        .update({
          kyc_status: 'rejected'
        })
        .eq('id', userId);

      // Log audit
      await supabaseAdmin.from('audit_logs').insert({
        user_id: decoded.userId,
        action: 'kyc_rejected',
        resource_type: 'user',
        resource_id: userId,
        details: { reason },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        severity: 'info'
      });

      // Send notification
      await sendNotification(userId, 'kyc_rejected', { reason });

      return NextResponse.json({
        success: true,
        message: 'KYC rejected'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('KYC approval error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
