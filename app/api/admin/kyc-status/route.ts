import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/auth';

const ALLOWED_STATUSES = ['pending', 'approved', 'rejected'] as const;
type KycStatus = typeof ALLOWED_STATUSES[number];

type UpdatePayload = {
  userId?: string;
  status?: KycStatus;
  rejectionReason?: string;
};

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
    }

    const { data: admin, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', decoded.userId)
      .single();

    if (adminError || !admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = (await request.json()) as UpdatePayload;

    if (!body.userId || !body.status) {
      return NextResponse.json({ error: 'userId and status are required' }, { status: 400 });
    }

    if (!ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status supplied' }, { status: 400 });
    }

    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', body.userId)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rejectionReason = body.status === 'rejected' ? body.rejectionReason ?? 'Rejected by admin' : null;

    const updatedDocuments = {
      ...(targetUser.kyc_documents || {}),
      lastManualUpdateBy: admin.id,
      lastManualUpdateAt: new Date().toISOString(),
      rejectionReason,
    };

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        kyc_status: body.status,
        kyc_documents: updatedDocuments,
      })
      .eq('id', targetUser.id);

    if (updateError) {
      console.error('Manual KYC update error:', updateError);
      return NextResponse.json({ error: 'Failed to update KYC status' }, { status: 500 });
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: admin.id,
      action: 'kyc_status_updated',
      resource_type: 'user',
      resource_id: targetUser.id,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      details: {
        newStatus: body.status,
        rejectionReason,
      },
      severity: 'info',
    });

    return NextResponse.json(
      {
        success: true,
        message: `User KYC status updated to ${body.status}`,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          kycStatus: body.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('KYC status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
