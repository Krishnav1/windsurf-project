/**
 * Automated KYC Expiry Checker
 * Runs daily to check and handle KYC expiries
 * 
 * Setup in Vercel:
 * 1. Add to vercel.json:
 *    "crons": [{ "path": "/api/cron/kyc-expiry-check", "schedule": "0 2 * * *" }]
 * 2. Or use external cron service to call this endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

// Verify cron secret to prevent unauthorized calls
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
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

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const results = {
      expiredKYCs: 0,
      warning30Days: 0,
      warning7Days: 0,
      autoFrozen: 0,
      errors: [] as string[]
    };

    // 1. Find and handle expired KYCs
    const { data: expiredKYCs } = await supabaseAdmin
      .from('investor_identities')
      .select('*')
      .eq('kyc_status', 'approved')
      .lt('expires_at', now.toISOString());

    if (expiredKYCs && expiredKYCs.length > 0) {
      for (const investor of expiredKYCs) {
        try {
          // Update KYC status to expired
          await supabaseAdmin
            .from('investor_identities')
            .update({ kyc_status: 'expired' })
            .eq('id', investor.id);

          // Create frozen tokens log entry
          await supabaseAdmin
            .from('frozen_tokens_log')
            .insert({
              token_address: 'ALL_TOKENS',
              investor_address: investor.wallet_address,
              user_id: investor.user_id,
              amount: 0,
              reason: 'KYC expired automatically',
              frozen_by: '00000000-0000-0000-0000-000000000000', // System
              status: 'frozen'
            });

          // Send notification (email/SMS)
          await sendNotification(investor, 'kyc_expired');

          results.expiredKYCs++;
          results.autoFrozen++;
        } catch (error: any) {
          results.errors.push(`Error processing expired KYC for ${investor.user_id}: ${error.message}`);
        }
      }
    }

    // 2. Find KYCs expiring in 30 days
    const { data: expiring30Days } = await supabaseAdmin
      .from('investor_identities')
      .select('*')
      .eq('kyc_status', 'approved')
      .gte('expires_at', now.toISOString())
      .lte('expires_at', in30Days.toISOString());

    if (expiring30Days && expiring30Days.length > 0) {
      for (const investor of expiring30Days) {
        try {
          await sendNotification(investor, 'kyc_expiring_30_days');
          results.warning30Days++;
        } catch (error: any) {
          results.errors.push(`Error sending 30-day warning to ${investor.user_id}: ${error.message}`);
        }
      }
    }

    // 3. Find KYCs expiring in 7 days
    const { data: expiring7Days } = await supabaseAdmin
      .from('investor_identities')
      .select('*')
      .eq('kyc_status', 'approved')
      .gte('expires_at', now.toISOString())
      .lte('expires_at', in7Days.toISOString());

    if (expiring7Days && expiring7Days.length > 0) {
      for (const investor of expiring7Days) {
        try {
          await sendNotification(investor, 'kyc_expiring_7_days');
          results.warning7Days++;
        } catch (error: any) {
          results.errors.push(`Error sending 7-day warning to ${investor.user_id}: ${error.message}`);
        }
      }
    }

    // Log the cron job execution
    await supabaseAdmin.from('audit_logs').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // System
      action: 'kyc_expiry_check',
      resource_type: 'cron_job',
      resource_id: 'kyc-expiry-check',
      details: results,
      ip_address: 'system',
      user_agent: 'cron'
    });

    return NextResponse.json({
      success: true,
      message: 'KYC expiry check completed',
      results
    });

  } catch (error: any) {
    console.error('KYC expiry check error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to send notifications
async function sendNotification(investor: any, type: string) {
  if (!supabaseAdmin) return;
  
  // Get user details
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('email, full_name')
    .eq('id', investor.user_id)
    .single();

  if (!user) return;

  const messages = {
    kyc_expired: {
      subject: '🔒 Your KYC has Expired - Tokens Frozen',
      body: `Dear ${user.full_name},\n\nYour KYC verification has expired. Your tokens have been automatically frozen for security.\n\nPlease renew your KYC immediately to regain access to your tokens.\n\nRenew now: ${process.env.NEXT_PUBLIC_APP_URL}/compliance/kyc-submit\n\nBest regards,\nTokenPlatform Team`
    },
    kyc_expiring_30_days: {
      subject: '⚠️ Your KYC Expires in 30 Days',
      body: `Dear ${user.full_name},\n\nYour KYC verification will expire in 30 days on ${new Date(investor.expires_at).toLocaleDateString()}.\n\nPlease renew your KYC before expiry to avoid token freezing.\n\nRenew now: ${process.env.NEXT_PUBLIC_APP_URL}/compliance/kyc-submit\n\nBest regards,\nTokenPlatform Team`
    },
    kyc_expiring_7_days: {
      subject: '🚨 URGENT: Your KYC Expires in 7 Days',
      body: `Dear ${user.full_name},\n\nYour KYC verification will expire in 7 days on ${new Date(investor.expires_at).toLocaleDateString()}.\n\nThis is your final warning. Please renew immediately to avoid token freezing.\n\nRenew now: ${process.env.NEXT_PUBLIC_APP_URL}/compliance/kyc-submit\n\nBest regards,\nTokenPlatform Team`
    }
  };

  const message = messages[type as keyof typeof messages];

  // TODO: Implement actual email sending
  // For now, just log
  console.log(`Notification sent to ${user.email}:`, message.subject);

  // In production, use:
  // await sendEmail(user.email, message.subject, message.body);
  // await sendSMS(user.phone, message.body); // For 7-day warning
}
