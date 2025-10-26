/**
 * IFSCA Compliance Reports API
 * 
 * GET /api/admin/reports/ifsca
 * Generates comprehensive IFSCA compliance reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/auth/jwt';

interface ReportData {
  reportType: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  summary: {
    totalTokens: number;
    activeTokens: number;
    totalValuations: number;
    pendingValuations: number;
    priceChanges: number;
    ifscaApprovals: number;
    complianceIssues: number;
  };
  tokens: any[];
  valuations: any[];
  priceChanges: any[];
  complianceAlerts: any[];
  kycActivity: any[];
}

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

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .single();

    if (user?.role !== 'admin' && user?.role !== 'auditor') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'monthly_compliance';
    const periodStart = searchParams.get('periodStart') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const periodEnd = searchParams.get('periodEnd') || new Date().toISOString().split('T')[0];
    const format = searchParams.get('format') || 'json'; // json, csv, pdf

    // Fetch all required data
    const [
      tokensResult,
      valuationsResult,
      priceChangesResult,
      complianceAlertsResult,
      kycActivityResult,
    ] = await Promise.all([
      // Tokens data
      supabaseAdmin
        .from('tokens')
        .select('*')
        .order('created_at', { ascending: false }),
      
      // Valuations in period
      supabaseAdmin
        .from('token_valuations')
        .select('*, tokens(token_symbol, token_name)')
        .gte('valuation_date', periodStart)
        .lte('valuation_date', periodEnd)
        .order('valuation_date', { ascending: false }),
      
      // Price changes in period
      supabaseAdmin
        .from('token_price_history')
        .select('*, tokens(token_symbol, token_name)')
        .gte('effective_date', periodStart)
        .lte('effective_date', periodEnd)
        .order('effective_date', { ascending: false }),
      
      // Compliance alerts in period
      supabaseAdmin
        .from('compliance_alerts')
        .select('*, tokens(token_symbol, token_name)')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)
        .order('created_at', { ascending: false }),
      
      // KYC activity in period
      supabaseAdmin
        .from('kyc_documents')
        .select('*, users(full_name, email, role)')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)
        .order('created_at', { ascending: false }),
    ]);

    const tokens = tokensResult.data || [];
    const valuations = valuationsResult.data || [];
    const priceChanges = priceChangesResult.data || [];
    const complianceAlerts = complianceAlertsResult.data || [];
    const kycActivity = kycActivityResult.data || [];

    // Calculate summary statistics
    const summary = {
      totalTokens: tokens.length,
      activeTokens: tokens.filter(t => t.status === 'active').length,
      totalValuations: valuations.length,
      pendingValuations: valuations.filter(v => v.status === 'pending').length,
      priceChanges: priceChanges.length,
      ifscaApprovals: priceChanges.filter(p => p.price_type === 'valuation' && Math.abs(p.price_change_percentage || 0) > 20).length,
      complianceIssues: complianceAlerts.filter(a => a.status === 'active').length,
    };

    const reportData: ReportData = {
      reportType,
      periodStart,
      periodEnd,
      generatedAt: new Date().toISOString(),
      summary,
      tokens: tokens.map(t => ({
        id: t.id,
        symbol: t.token_symbol,
        name: t.token_name,
        status: t.status,
        currentPrice: t.current_price,
        lastValuationDate: t.last_valuation_date,
        nextValuationDue: t.next_valuation_due,
        complianceStatus: t.compliance_status,
      })),
      valuations: valuations.map(v => ({
        id: v.id,
        tokenSymbol: v.tokens?.token_symbol,
        valuationDate: v.valuation_date,
        valuationAmount: v.valuation_amount,
        changePercentage: v.change_percentage,
        agency: v.valuation_agency,
        valuer: v.valuer_name,
        status: v.status,
        requiresIFSCA: Math.abs(v.change_percentage || 0) > 20,
      })),
      priceChanges: priceChanges.map(p => ({
        id: p.id,
        tokenSymbol: p.tokens?.token_symbol,
        effectiveDate: p.effective_date,
        oldPrice: p.old_price,
        newPrice: p.new_price,
        changePercentage: p.price_change_percentage,
        priceType: p.price_type,
        reason: p.reason,
      })),
      complianceAlerts: complianceAlerts.map(a => ({
        id: a.id,
        tokenSymbol: a.tokens?.token_symbol,
        alertType: a.alert_type,
        severity: a.severity,
        title: a.title,
        status: a.status,
        createdAt: a.created_at,
      })),
      kycActivity: kycActivity.map(k => ({
        id: k.id,
        userName: k.users?.full_name,
        userEmail: k.users?.email,
        userRole: k.users?.role,
        documentType: k.document_type,
        status: k.status,
        verifiedAt: k.verified_at,
      })),
    };

    // Save report to database
    const { data: savedReport } = await supabaseAdmin
      .from('ifsca_reports')
      .insert({
        report_type: reportType,
        report_period_start: periodStart,
        report_period_end: periodEnd,
        report_title: `${reportType.replace('_', ' ').toUpperCase()} - ${periodStart} to ${periodEnd}`,
        report_data: reportData,
        summary: `Generated ${reportType} report for period ${periodStart} to ${periodEnd}`,
        key_findings: [
          `Total Tokens: ${summary.totalTokens}`,
          `Active Tokens: ${summary.activeTokens}`,
          `Valuations Submitted: ${summary.totalValuations}`,
          `Price Changes: ${summary.priceChanges}`,
          `IFSCA Approvals Required: ${summary.ifscaApprovals}`,
          `Active Compliance Issues: ${summary.complianceIssues}`,
        ],
        compliance_status: summary.complianceIssues === 0 ? 'compliant' : 'partial',
        report_file_format: format,
        generated_by: decoded.userId,
        auto_generated: false,
      })
      .select()
      .single();

    // Log report generation
    await supabaseAdmin.from('audit_logs').insert({
      user_id: decoded.userId,
      action: 'ifsca_report_generated',
      resource_type: 'ifsca_report',
      resource_id: savedReport?.id,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      details: {
        reportType,
        periodStart,
        periodEnd,
        format,
      },
      severity: 'info',
    });

    // Return based on format
    if (format === 'csv') {
      return generateCSVReport(reportData);
    } else if (format === 'pdf') {
      return NextResponse.json({
        success: true,
        message: 'PDF generation not yet implemented. Use CSV or JSON format.',
        reportId: savedReport?.id,
      });
    } else {
      return NextResponse.json({
        success: true,
        report: reportData,
        reportId: savedReport?.id,
      });
    }

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateCSVReport(reportData: ReportData): NextResponse {
  const lines: string[] = [];
  
  // Header
  lines.push(`IFSCA Compliance Report`);
  lines.push(`Report Type: ${reportData.reportType}`);
  lines.push(`Period: ${reportData.periodStart} to ${reportData.periodEnd}`);
  lines.push(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`);
  lines.push('');
  
  // Summary
  lines.push('SUMMARY');
  lines.push(`Total Tokens,${reportData.summary.totalTokens}`);
  lines.push(`Active Tokens,${reportData.summary.activeTokens}`);
  lines.push(`Total Valuations,${reportData.summary.totalValuations}`);
  lines.push(`Pending Valuations,${reportData.summary.pendingValuations}`);
  lines.push(`Price Changes,${reportData.summary.priceChanges}`);
  lines.push(`IFSCA Approvals,${reportData.summary.ifscaApprovals}`);
  lines.push(`Compliance Issues,${reportData.summary.complianceIssues}`);
  lines.push('');
  
  // Tokens
  lines.push('TOKENS');
  lines.push('Symbol,Name,Status,Current Price,Last Valuation,Next Due,Compliance');
  reportData.tokens.forEach(t => {
    lines.push(`${t.symbol},${t.name},${t.status},${t.currentPrice || 'N/A'},${t.lastValuationDate || 'N/A'},${t.nextValuationDue || 'N/A'},${t.complianceStatus || 'N/A'}`);
  });
  lines.push('');
  
  // Valuations
  lines.push('VALUATIONS');
  lines.push('Token,Date,Amount,Change %,Agency,Valuer,Status,IFSCA Required');
  reportData.valuations.forEach(v => {
    lines.push(`${v.tokenSymbol},${v.valuationDate},${v.valuationAmount},${v.changePercentage || 'N/A'},${v.agency},${v.valuer},${v.status},${v.requiresIFSCA ? 'Yes' : 'No'}`);
  });
  lines.push('');
  
  // Price Changes
  lines.push('PRICE CHANGES');
  lines.push('Token,Date,Old Price,New Price,Change %,Type,Reason');
  reportData.priceChanges.forEach(p => {
    lines.push(`${p.tokenSymbol},${p.effectiveDate},${p.oldPrice},${p.newPrice},${p.changePercentage || 'N/A'},${p.priceType},${p.reason}`);
  });
  lines.push('');
  
  // Compliance Alerts
  lines.push('COMPLIANCE ALERTS');
  lines.push('Token,Type,Severity,Title,Status,Created');
  reportData.complianceAlerts.forEach(a => {
    lines.push(`${a.tokenSymbol || 'N/A'},${a.alertType},${a.severity},${a.title},${a.status},${a.createdAt}`);
  });
  
  const csv = lines.join('\n');
  
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="ifsca_report_${reportData.periodStart}_${reportData.periodEnd}.csv"`,
    },
  });
}

// POST endpoint to manually trigger report generation
export async function POST(request: NextRequest) {
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

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .single();

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reportType, periodStart, periodEnd } = body;

    // Redirect to GET with parameters
    const url = new URL(request.url);
    url.searchParams.set('type', reportType);
    url.searchParams.set('periodStart', periodStart);
    url.searchParams.set('periodEnd', periodEnd);

    return NextResponse.redirect(url);

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
