/**
 * Issuer Valuation Submission API
 * 
 * POST /api/issuer/submit-valuation
 * Allows issuers to submit quarterly asset valuations
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/auth/jwt';
import { FileUploadService } from '@/lib/storage/fileUpload';
import crypto from 'crypto';

// Helper function to compute file hash
function computeFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function POST(request: NextRequest) {
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

    // Get user from database
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is issuer or admin
    if (user.role !== 'issuer' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only issuers can submit valuations' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    
    const tokenId = formData.get('tokenId') as string;
    const valuationDate = formData.get('valuationDate') as string;
    const valuationAmount = formData.get('valuationAmount') as string;
    const valuationAgency = formData.get('valuationAgency') as string;
    const valuerName = formData.get('valuerName') as string;
    const valuerRegistrationNo = formData.get('valuerRegistrationNo') as string;
    const valuerContactEmail = formData.get('valuerContactEmail') as string;
    const valuerContactPhone = formData.get('valuerContactPhone') as string;
    const methodology = formData.get('methodology') as string;
    const methodologyDescription = formData.get('methodologyDescription') as string;
    const marketConditions = formData.get('marketConditions') as string;
    const assumptions = formData.get('assumptions') as string; // JSON string
    const submissionNotes = formData.get('submissionNotes') as string;

    // Validate required fields
    if (!tokenId || !valuationDate || !valuationAmount || !valuationAgency || !valuerName || !valuerRegistrationNo || !methodology) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify token ownership
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('tokens')
      .select('*')
      .eq('id', tokenId)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    if (tokenData.issuer_id !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You can only submit valuations for your own tokens' },
        { status: 403 }
      );
    }

    // Get previous valuation for comparison
    const { data: previousValuation } = await supabaseAdmin
      .from('token_valuations')
      .select('valuation_amount')
      .eq('token_id', tokenId)
      .eq('is_current', true)
      .single();

    const previousAmount = previousValuation?.valuation_amount || tokenData.asset_valuation || null;

    // Process uploaded documents
    const valuationReport = formData.get('valuationReport') as File | null;
    const valuationCertificate = formData.get('valuationCertificate') as File | null;

    let reportUrl = '';
    let reportHash = '';
    let reportFileName = '';
    let reportFileSize = 0;
    let certificateUrl = '';
    let certificateHash = '';

    // Upload valuation report
    if (valuationReport) {
      try {
        const reportBuffer = Buffer.from(await valuationReport.arrayBuffer());
        reportHash = computeFileHash(reportBuffer);
        reportFileName = valuationReport.name;
        reportFileSize = valuationReport.size;

        const uploadResult = await FileUploadService.uploadIssuerDocument(
          valuationReport,
          tokenId,
          user.id,
          'valuation_report',
          'valuation'
        );
        reportUrl = uploadResult.fileUrl;
      } catch (uploadError) {
        console.error('Valuation report upload error:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload valuation report' },
          { status: 500 }
        );
      }
    }

    // Upload valuation certificate
    if (valuationCertificate) {
      try {
        const certBuffer = Buffer.from(await valuationCertificate.arrayBuffer());
        certificateHash = computeFileHash(certBuffer);

        const uploadResult = await FileUploadService.uploadIssuerDocument(
          valuationCertificate,
          tokenId,
          user.id,
          'valuation_certificate',
          'valuation'
        );
        certificateUrl = uploadResult.fileUrl;
      } catch (uploadError) {
        console.error('Certificate upload error:', uploadError);
      }
    }

    // Parse assumptions JSON
    let assumptionsData = null;
    if (assumptions) {
      try {
        assumptionsData = JSON.parse(assumptions);
      } catch (e) {
        assumptionsData = { raw: assumptions };
      }
    }

    // Create valuation record
    const { data: newValuation, error: insertError } = await supabaseAdmin
      .from('token_valuations')
      .insert({
        token_id: tokenId,
        valuation_date: valuationDate,
        valuation_amount: parseFloat(valuationAmount),
        previous_valuation_amount: previousAmount,
        valuation_agency: valuationAgency,
        valuer_name: valuerName,
        valuer_registration_no: valuerRegistrationNo,
        valuer_contact_email: valuerContactEmail || null,
        valuer_contact_phone: valuerContactPhone || null,
        report_document_url: reportUrl || null,
        report_file_name: reportFileName || null,
        report_file_size: reportFileSize || null,
        report_hash: reportHash || null,
        certificate_url: certificateUrl || null,
        certificate_hash: certificateHash || null,
        methodology,
        methodology_description: methodologyDescription || null,
        market_conditions: marketConditions || null,
        assumptions: assumptionsData,
        status: 'pending',
        submitted_by: user.id,
        submission_notes: submissionNotes || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create valuation record' },
        { status: 500 }
      );
    }

    // Create compliance alert for admin review
    await supabaseAdmin.from('compliance_alerts').insert({
      alert_type: 'price_change_pending',
      severity: 'medium',
      title: 'New Valuation Submitted',
      description: `Token ${tokenData.token_symbol} has a new valuation pending review`,
      token_id: tokenId,
      alert_data: {
        valuationId: newValuation.id,
        valuationAmount: parseFloat(valuationAmount),
        previousAmount,
        changePercentage: newValuation.change_percentage,
      },
      status: 'active',
    });

    // Log submission in audit logs
    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'valuation_submitted',
      resource_type: 'token_valuation',
      resource_id: newValuation.id,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      details: {
        tokenId,
        tokenSymbol: tokenData.token_symbol,
        valuationAmount: parseFloat(valuationAmount),
        valuationDate,
        valuerName,
      },
      severity: 'info',
    });

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Valuation submitted successfully. Awaiting admin review.',
      valuation: {
        id: newValuation.id,
        tokenId: newValuation.token_id,
        valuationAmount: newValuation.valuation_amount,
        changePercentage: newValuation.change_percentage,
        status: newValuation.status,
        reportUrl: reportUrl || null,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Valuation submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch valuations for a token
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded || !supabaseAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID required' },
        { status: 400 }
      );
    }

    // Verify access
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .single();

    const { data: tokenData } = await supabaseAdmin
      .from('tokens')
      .select('issuer_id')
      .eq('id', tokenId)
      .single();

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    if (user?.role !== 'admin' && user?.role !== 'auditor' && tokenData.issuer_id !== decoded.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Fetch valuations
    const { data: valuations, error } = await supabaseAdmin
      .from('token_valuations')
      .select('*')
      .eq('token_id', tokenId)
      .order('valuation_date', { ascending: false });

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch valuations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      valuations: valuations || [],
    });

  } catch (error) {
    console.error('Fetch valuations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
