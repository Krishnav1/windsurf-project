/**
 * KYC Verification Middleware
 * Ensures user has approved KYC before accessing certain features
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';

export interface KYCCheckResult {
  allowed: boolean;
  kycStatus: string;
  message?: string;
  userId?: string;
}

/**
 * Check if user has approved KYC
 */
export async function checkKYCStatus(token: string): Promise<KYCCheckResult> {
  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return {
        allowed: false,
        kycStatus: 'unknown',
        message: 'Invalid authentication token'
      };
    }

    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // Get user KYC status
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, kyc_status, role')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return {
        allowed: false,
        kycStatus: 'unknown',
        message: 'User not found'
      };
    }

    // Admins and auditors bypass KYC check
    if (user.role === 'admin' || user.role === 'auditor') {
      return {
        allowed: true,
        kycStatus: 'admin_bypass',
        userId: user.id
      };
    }

    // Check KYC status
    if (user.kyc_status === 'approved') {
      return {
        allowed: true,
        kycStatus: 'approved',
        userId: user.id
      };
    }

    return {
      allowed: false,
      kycStatus: user.kyc_status || 'not_started',
      message: user.kyc_status === 'pending' 
        ? 'Your KYC is under review. You will be notified once approved.'
        : user.kyc_status === 'rejected'
        ? 'Your KYC was rejected. Please resubmit your documents.'
        : 'Please complete KYC verification to access this feature.',
      userId: user.id
    };

  } catch (error) {
    console.error('KYC check error:', error);
    return {
      allowed: false,
      kycStatus: 'error',
      message: 'Failed to verify KYC status'
    };
  }
}

/**
 * Middleware function to protect API routes
 */
export async function requireApprovedKYC(request: NextRequest): Promise<NextResponse | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized', kycRequired: true },
      { status: 401 }
    );
  }

  const kycCheck = await checkKYCStatus(token);

  if (!kycCheck.allowed) {
    return NextResponse.json(
      {
        error: 'KYC verification required',
        kycRequired: true,
        kycStatus: kycCheck.kycStatus,
        message: kycCheck.message
      },
      { status: 403 }
    );
  }

  // KYC approved, allow request to continue
  return null;
}

/**
 * Check investment limits based on KYC level
 */
export async function checkInvestmentLimit(
  userId: string,
  amount: number
): Promise<{ allowed: boolean; limit: number; message?: string }> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // Get user info
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('kyc_status, investor_type, total_invested')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return {
        allowed: false,
        limit: 0,
        message: 'User not found'
      };
    }

    // Define limits based on investor type
    let investmentLimit = 0;
    
    if (user.investor_type === 'accredited') {
      investmentLimit = 10000000; // ₹1 Crore for accredited investors
    } else if (user.kyc_status === 'approved') {
      investmentLimit = 1000000; // ₹10 Lakhs for regular KYC
    } else {
      investmentLimit = 50000; // ₹50,000 for basic verification
    }

    const totalInvested = user.total_invested || 0;
    const remainingLimit = investmentLimit - totalInvested;

    if (amount > remainingLimit) {
      return {
        allowed: false,
        limit: remainingLimit,
        message: `Investment amount exceeds your limit. Remaining limit: ₹${remainingLimit.toLocaleString('en-IN')}`
      };
    }

    return {
      allowed: true,
      limit: remainingLimit
    };

  } catch (error) {
    console.error('Investment limit check error:', error);
    return {
      allowed: false,
      limit: 0,
      message: 'Failed to check investment limit'
    };
  }
}
