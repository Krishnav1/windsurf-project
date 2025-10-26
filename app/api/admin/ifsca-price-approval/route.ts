/**
 * IFSCA Price Change Approval API
 * 
 * POST /api/admin/ifsca-price-approval
 * Handles IFSCA approval for price changes >20%
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/auth/jwt';

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
    
    if (!decoded || !supabaseAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      priceApprovalId, 
      action, 
      ifscaReferenceNo, 
      ifscaApprovalDate, 
      ifscaApprovalDocumentUrl,
      ifscaNotes 
    } = body;

    if (!priceApprovalId || !action) {
      return NextResponse.json(
        { error: 'Price approval ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'submit', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "submit", "approve", or "reject"' },
        { status: 400 }
      );
    }

    // Get price approval record
    const { data: priceApproval, error: approvalError } = await supabaseAdmin
      .from('price_change_approvals')
      .select('*, tokens(*), token_valuations(*)')
      .eq('id', priceApprovalId)
      .single();

    if (approvalError || !priceApproval) {
      return NextResponse.json(
        { error: 'Price approval not found' },
        { status: 404 }
      );
    }

    // Handle submission to IFSCA
    if (action === 'submit') {
      // Create regulatory submission record
      const { data: submission, error: submissionError } = await supabaseAdmin
        .from('regulatory_submissions')
        .insert({
          submission_type: 'price_change_approval',
          submission_title: `Price Change Approval - ${priceApproval.tokens.token_symbol}`,
          submission_description: `Requesting IFSCA approval for ${priceApproval.change_percentage.toFixed(2)}% price change`,
          token_id: priceApproval.token_id,
          valuation_id: priceApproval.valuation_id,
          price_approval_id: priceApprovalId,
          submission_data: {
            tokenSymbol: priceApproval.tokens.token_symbol,
            oldPrice: priceApproval.old_price,
            newPrice: priceApproval.new_price,
            changePercentage: priceApproval.change_percentage,
            valuationAmount: priceApproval.token_valuations?.valuation_amount,
            valuationDate: priceApproval.token_valuations?.valuation_date,
            valuerName: priceApproval.token_valuations?.valuer_name,
            valuationAgency: priceApproval.token_valuations?.valuation_agency,
          },
          status: 'submitted',
          ifsca_reference_no: ifscaReferenceNo || null,
          submission_date: new Date().toISOString(),
          submission_method: 'portal',
          submitted_by: user.id,
        })
        .select()
        .single();

      if (submissionError) {
        console.error('Submission error:', submissionError);
        return NextResponse.json(
          { error: 'Failed to create IFSCA submission' },
          { status: 500 }
        );
      }

      // Update price approval
      await supabaseAdmin
        .from('price_change_approvals')
        .update({
          ifsca_submitted_at: new Date().toISOString(),
          ifsca_submission_reference: ifscaReferenceNo || submission.id,
          status: 'awaiting_ifsca',
        })
        .eq('id', priceApprovalId);

      // Log submission
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'ifsca_submission_created',
        resource_type: 'price_change_approval',
        resource_id: priceApprovalId,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        details: {
          tokenId: priceApproval.token_id,
          tokenSymbol: priceApproval.tokens.token_symbol,
          submissionId: submission.id,
          ifscaReferenceNo,
        },
        severity: 'info',
      });

      return NextResponse.json({
        success: true,
        message: 'Submitted to IFSCA for approval',
        submission: {
          id: submission.id,
          referenceNo: ifscaReferenceNo || submission.id,
        },
      });
    }

    // Handle IFSCA approval
    if (action === 'approve') {
      if (!ifscaReferenceNo || !ifscaApprovalDate) {
        return NextResponse.json(
          { error: 'IFSCA reference number and approval date are required' },
          { status: 400 }
        );
      }

      // Update price approval with IFSCA details
      await supabaseAdmin
        .from('price_change_approvals')
        .update({
          status: 'ifsca_approved',
          ifsca_approval_date: ifscaApprovalDate,
          ifsca_approval_document_url: ifscaApprovalDocumentUrl || null,
          ifsca_notes: ifscaNotes || null,
        })
        .eq('id', priceApprovalId);

      // Update valuation with IFSCA approval
      if (priceApproval.valuation_id) {
        await supabaseAdmin
          .from('token_valuations')
          .update({
            ifsca_reference_no: ifscaReferenceNo,
            ifsca_approval_date: ifscaApprovalDate,
            ifsca_approval_document_url: ifscaApprovalDocumentUrl || null,
            is_current: true,
          })
          .eq('id', priceApproval.valuation_id);
      }

      // Now update the token price
      const newPrice = priceApproval.new_price;
      const oldPrice = priceApproval.old_price;

      await supabaseAdmin
        .from('tokens')
        .update({
          current_price: newPrice,
          price_per_token: newPrice,
          last_price_update: new Date().toISOString(),
          last_valuation_date: priceApproval.token_valuations?.valuation_date,
          next_valuation_due: priceApproval.token_valuations?.valuation_date 
            ? new Date(new Date(priceApproval.token_valuations.valuation_date).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : null,
        })
        .eq('id', priceApproval.token_id);

      // Create price history record
      const { data: priceHistory } = await supabaseAdmin
        .from('token_price_history')
        .insert({
          token_id: priceApproval.token_id,
          old_price: oldPrice,
          new_price: newPrice,
          price_type: 'valuation',
          valuation_id: priceApproval.valuation_id,
          reason: 'IFSCA approved price change',
          detailed_notes: ifscaNotes || 'Approved by IFSCA',
          changed_by: user.id,
          approved_by: user.id,
          approval_date: new Date().toISOString(),
          effective_date: ifscaApprovalDate,
        })
        .select()
        .single();

      // Update price approval
      await supabaseAdmin
        .from('price_change_approvals')
        .update({
          status: 'approved',
          final_approved_by: user.id,
          final_approved_at: new Date().toISOString(),
          price_updated: true,
          price_update_date: new Date().toISOString(),
          price_history_id: priceHistory?.id,
        })
        .eq('id', priceApprovalId);

      // Update user holdings
      await supabaseAdmin.rpc('update_user_holdings_value', {
        p_token_id: priceApproval.token_id,
        p_new_price: newPrice,
      });

      // Notify all token holders
      const { data: holders } = await supabaseAdmin
        .from('user_holdings')
        .select('user_id, quantity')
        .eq('token_id', priceApproval.token_id)
        .gt('quantity', 0);

      if (holders && holders.length > 0) {
        const notifications = holders.map(holder => ({
          user_id: holder.user_id,
          type: 'price_update',
          title: 'Token Price Updated (IFSCA Approved)',
          message: `The price of ${priceApproval.tokens.token_symbol} has been updated to ₹${newPrice.toFixed(2)} per token (${priceApproval.change_percentage > 0 ? '+' : ''}${priceApproval.change_percentage.toFixed(2)}%) with IFSCA approval`,
          data: {
            tokenId: priceApproval.token_id,
            tokenSymbol: priceApproval.tokens.token_symbol,
            oldPrice,
            newPrice,
            changePercentage: priceApproval.change_percentage,
            ifscaApproved: true,
            ifscaReferenceNo,
          },
          status: 'unread',
        }));

        await supabaseAdmin.from('notifications').insert(notifications);

        await supabaseAdmin
          .from('token_price_history')
          .update({
            holders_notified: true,
            notification_sent_at: new Date().toISOString(),
            total_holders_notified: holders.length,
          })
          .eq('id', priceHistory?.id);
      }

      // Update regulatory submission
      await supabaseAdmin
        .from('regulatory_submissions')
        .update({
          status: 'approved',
          response_received: true,
          response_date: ifscaApprovalDate,
          response_status: 'approved',
          response_notes: ifscaNotes || 'Approved by IFSCA',
          response_document_url: ifscaApprovalDocumentUrl || null,
        })
        .eq('price_approval_id', priceApprovalId);

      // Resolve compliance alert
      await supabaseAdmin
        .from('compliance_alerts')
        .update({
          status: 'resolved',
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: 'IFSCA approval received - Price updated',
        })
        .eq('alert_data->>priceApprovalId', priceApprovalId)
        .eq('status', 'active');

      // Log approval
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'ifsca_price_approved',
        resource_type: 'price_change_approval',
        resource_id: priceApprovalId,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        details: {
          tokenId: priceApproval.token_id,
          tokenSymbol: priceApproval.tokens.token_symbol,
          ifscaReferenceNo,
          oldPrice,
          newPrice,
          changePercentage: priceApproval.change_percentage,
        },
        severity: 'info',
      });

      return NextResponse.json({
        success: true,
        message: 'IFSCA approval recorded and price updated successfully',
        data: {
          priceApprovalId,
          ifscaReferenceNo,
          oldPrice,
          newPrice,
          changePercentage: priceApproval.change_percentage,
          holdersNotified: holders?.length || 0,
        },
      });
    }

    // Handle rejection
    if (action === 'reject') {
      await supabaseAdmin
        .from('price_change_approvals')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: ifscaNotes || 'Rejected by IFSCA',
        })
        .eq('id', priceApprovalId);

      if (priceApproval.valuation_id) {
        await supabaseAdmin
          .from('token_valuations')
          .update({
            status: 'rejected',
            rejection_reason: 'IFSCA rejected price change',
          })
          .eq('id', priceApproval.valuation_id);
      }

      await supabaseAdmin
        .from('regulatory_submissions')
        .update({
          status: 'rejected',
          response_received: true,
          response_date: new Date().toISOString().split('T')[0],
          response_status: 'rejected',
          response_notes: ifscaNotes || 'Rejected by IFSCA',
        })
        .eq('price_approval_id', priceApprovalId);

      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'ifsca_price_rejected',
        resource_type: 'price_change_approval',
        resource_id: priceApprovalId,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        details: {
          tokenId: priceApproval.token_id,
          reason: ifscaNotes,
        },
        severity: 'warning',
      });

      return NextResponse.json({
        success: true,
        message: 'IFSCA rejection recorded',
      });
    }

  } catch (error) {
    console.error('IFSCA approval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch pending IFSCA approvals
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

    // Fetch pending IFSCA approvals
    const { data: approvals, error } = await supabaseAdmin
      .from('price_change_approvals')
      .select('*, tokens(token_symbol, token_name), token_valuations(*)')
      .in('status', ['awaiting_ifsca', 'ifsca_approved'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch IFSCA approvals' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      approvals: approvals || [],
    });

  } catch (error) {
    console.error('Fetch IFSCA approvals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
