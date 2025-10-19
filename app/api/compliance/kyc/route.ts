import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/auth';

type KycSubmission = {
  documentType?: string;
  documentNumber?: string;
  proofOfAddress?: {
    type: string;
    referenceNumber?: string;
    issuedOn?: string;
  };
  netWorthCertificate?: {
    issuer: string;
    amount: number;
    currency: string;
    issuedOn?: string;
  };
  additionalDetails?: Record<string, unknown>;
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

    const payload = (await request.json()) as KycSubmission;

    if (!payload || Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'KYC submission payload required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const submissionRecord = {
      ...(user.kyc_documents || {}),
      submission: payload,
      submittedAt: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        kyc_status: 'pending',
        kyc_documents: submissionRecord,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('KYC submission update error:', updateError);
      return NextResponse.json({ error: 'Failed to submit KYC details' }, { status: 500 });
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'kyc_submitted',
      resource_type: 'user',
      resource_id: user.id,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      details: {
        documentTypes: Object.keys(payload || {}),
      },
      severity: 'info',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'KYC submission received. Your verification is pending review.',
        kycStatus: 'pending',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('KYC submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, kyc_status, kyc_documents')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const submission = user.kyc_documents?.submission || null;

    return NextResponse.json(
      {
        success: true,
        kycStatus: user.kyc_status,
        submission,
        lastUpdated: user.kyc_documents?.submittedAt || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('KYC status fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
