/**
 * ERC-3643 Admin Dashboard Stats API
 * Get comprehensive statistics for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
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

    // TODO: Verify admin from JWT - skipping for development

    // Verify admin
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    if (!userData.user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all statistics in parallel
    const [
      tokensResult,
      investorsResult,
      frozenResult,
      complianceResult,
      recoveryResult,
      kycExpiringResult
    ] = await Promise.all([
      // Total ERC-3643 tokens
      supabaseAdmin.from('erc3643_tokens').select('*', { count: 'exact' }),
      
      // Total verified investors
      supabaseAdmin.from('investor_identities')
        .select('*', { count: 'exact' })
        .eq('kyc_status', 'approved'),
      
      // Frozen tokens
      supabaseAdmin.from('frozen_tokens_log')
        .select('amount')
        .eq('status', 'frozen'),
      
      // Compliance checks today
      supabaseAdmin.from('compliance_checks')
        .select('passed', { count: 'exact' })
        .gte('checked_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      
      // Pending recovery requests
      supabaseAdmin.from('recovery_requests')
        .select('*', { count: 'exact' })
        .eq('status', 'pending'),
      
      // KYC expiring in 30 days
      supabaseAdmin.from('investor_identities')
        .select('*', { count: 'exact' })
        .eq('kyc_status', 'approved')
        .lte('expires_at', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
        .gte('expires_at', new Date().toISOString())
    ]);

    // Calculate frozen tokens total
    const totalFrozen = frozenResult.data?.reduce((sum, ft) => sum + parseFloat(ft.amount), 0) || 0;

    // Get investor category distribution
    const { data: categoryDist } = await supabaseAdmin
      .from('investor_identities')
      .select('investor_category')
      .eq('kyc_status', 'approved');

    const categoryCount = {
      retail: 0,
      accredited: 0,
      institutional: 0,
      founder: 0
    };

    categoryDist?.forEach(inv => {
      if (inv.investor_category in categoryCount) {
        categoryCount[inv.investor_category as keyof typeof categoryCount]++;
      }
    });

    // Get compliance pass/fail rate today
    const { data: complianceToday } = await supabaseAdmin
      .from('compliance_checks')
      .select('passed')
      .gte('checked_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

    const compliancePassed = complianceToday?.filter(c => c.passed).length || 0;
    const complianceFailed = complianceToday?.filter(c => !c.passed).length || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalTokens: tokensResult.count || 0,
        verifiedInvestors: investorsResult.count || 0,
        frozenTokensValue: totalFrozen,
        frozenAccountsCount: frozenResult.data?.length || 0,
        kycExpiringSoon: kycExpiringResult.count || 0,
        pendingRecoveries: recoveryResult.count || 0,
        complianceChecksToday: complianceResult.count || 0,
        compliancePassed,
        complianceFailed,
        categoryDistribution: categoryCount
      }
    });

  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
