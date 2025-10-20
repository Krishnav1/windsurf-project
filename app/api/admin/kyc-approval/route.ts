/**
 * KYC Approval API Route - DEPRECATED
 * 
 * @deprecated This endpoint is deprecated. Use /api/admin/kyc/verify instead.
 * This old system approves entire users instead of individual documents.
 * The new system provides document-level granularity and proper verification workflow.
 * 
 * POST /api/admin/kyc-approval
 * Allows admins to approve or reject user KYC requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';

export async function POST(request: NextRequest) {
  // Return deprecation warning
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Please use /api/admin/kyc/verify instead.',
      deprecated: true,
      newEndpoint: '/api/admin/kyc/verify',
      message: 'The new endpoint provides document-level verification instead of user-level approval.'
    },
    { status: 410 } // 410 Gone - indicates deprecated/removed resource
  );

  /* DEPRECATED CODE - Kept for reference
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

    // Get admin user
    const { data: admin } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, action, rejectionReason } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.kyc_status !== 'pending') {
      return NextResponse.json(
        { error: `KYC is already ${user.kyc_status}` },
        { status: 400 }
      );
    }

    // Update KYC status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        kyc_status: newStatus,
        kyc_documents: {
          ...user.kyc_documents,
          reviewedBy: admin.id,
          reviewedAt: new Date().toISOString(),
          rejectionReason: action === 'reject' ? rejectionReason : null,
        },
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update KYC status' },
        { status: 500 }
      );
    }

    // Log KYC decision
    await supabaseAdmin.from('audit_logs').insert({
      user_id: admin.id,
      action: `kyc_${action}d`,
      resource_type: 'user',
      resource_id: userId,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      details: {
        targetUser: user.email,
        action,
        rejectionReason: action === 'reject' ? rejectionReason : null,
      },
      severity: 'info',
    });

    return NextResponse.json({
      success: true,
      message: `KYC ${action}d successfully`,
      user: {
        id: user.id,
        email: user.email,
        kycStatus: newStatus,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('KYC approval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
  */
}

/**
 * GET /api/admin/kyc-approval - DEPRECATED
 * Get all pending KYC requests
 * @deprecated Use /api/admin/kyc/documents instead
 */
export async function GET(request: NextRequest) {
  // Return deprecation warning
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Please use /api/admin/kyc/documents instead.',
      deprecated: true,
      newEndpoint: '/api/admin/kyc/documents',
      message: 'The new endpoint provides document-level data with proper grouping by user.'
    },
    { status: 410 } // 410 Gone
  );

  /* DEPRECATED CODE - Kept for reference
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

    // Get admin user
    const { data: admin } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .single();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all users with their KYC status
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, mobile, country, role, kyc_status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      users,
    }, { status: 200 });

  } catch (error) {
    console.error('Get KYC requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
  */
}
