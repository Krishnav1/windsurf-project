/**
 * Admin Valuation Approval API
 * 
 * POST /api/admin/approve-valuation
 * Allows admins to review and approve/reject valuations
 * Automatically triggers price update workflow based on change percentage
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/auth/jwt';

const IFSCA_THRESHOLD_PERCENTAGE = 20; // 20% price change requires IFSCA approval

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

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { valuationId, action, reviewNotes, ifscaApprovalDocument } = body;

    if (!valuationId || !action) {
      return NextResponse.json(
        { error: 'Valuation ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get valuation from database
    const { data: valuation, error: valuationError } = await supabaseAdmin
      .from('token_valuations')
      .select('*, tokens(*)')
      .eq('id', valuationId)
      .single();

    if (valuationError || !valuation) {
      return NextResponse.json(
        { error: 'Valuation not found' },
        { status: 404 }
      );
    }

    if (valuation.status !== 'pending' && valuation.status !== 'under_review') {
      return NextResponse.json(
        { error: `Valuation is already ${valuation.status}` },
        { status: 400 }
      );
    }

    // Handle rejection
    if (action === 'reject') {
      const { error: updateError } = await supabaseAdmin
        .from('token_valuations')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          review_notes: reviewNotes || 'Rejected by admin',
          review_date: new Date().toISOString(),
          rejected_at: new Date().toISOString(),
          rejection_reason: reviewNotes || 'Rejected by admin',
        })
        .eq('id', valuationId);

      if (updateError) {
        console.error('Database update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to reject valuation' },
          { status: 500 }
        );
      }

      // Log rejection
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'valuation_rejected',
        resource_type: 'token_valuation',
        resource_id: valuationId,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        details: {
          tokenId: valuation.token_id,
          tokenSymbol: valuation.tokens.token_symbol,
          reason: reviewNotes,
        },
        severity: 'info',
      });

      // Resolve compliance alert
      await supabaseAdmin
        .from('compliance_alerts')
        .update({
          status: 'resolved',
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: 'Valuation rejected',
        })
        .eq('alert_data->>valuationId', valuationId)
        .eq('status', 'active');

      return NextResponse.json({
        success: true,
        message: 'Valuation rejected',
      }, { status: 200 });
    }

    // Handle approval
    const tokenData = valuation.tokens;
    const oldPrice = tokenData.current_price || (tokenData.asset_valuation / tokenData.total_supply);
    const newPrice = valuation.valuation_amount / tokenData.total_supply;
    const changePercentage = valuation.change_percentage || 0;

    // Check if IFSCA approval is required (>20% change)
    const requiresIFSCA = Math.abs(changePercentage) > IFSCA_THRESHOLD_PERCENTAGE;

    // Update valuation status
    const { error: updateError } = await supabaseAdmin
      .from('token_valuations')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        review_notes: reviewNotes || null,
        review_date: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        requires_ifsca_approval: requiresIFSCA,
        effective_from: new Date().toISOString().split('T')[0],
        is_current: !requiresIFSCA, // Only set as current if no IFSCA approval needed
      })
      .eq('id', valuationId);

    if (updateError) {
      console.error('Valuation update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve valuation' },
        { status: 500 }
      );
    }

    // Create price change approval record
    const { data: priceApproval, error: approvalError } = await supabaseAdmin
      .from('price_change_approvals')
      .insert({
        token_id: valuation.token_id,
        valuation_id: valuationId,
        old_price: oldPrice,
        new_price: newPrice,
        change_amount: newPrice - oldPrice,
        change_percentage: changePercentage,
        reason: 'Quarterly valuation update',
        detailed_justification: reviewNotes || 'Approved based on submitted valuation report',
        requires_ifsca_approval: requiresIFSCA,
        ifsca_threshold_exceeded: requiresIFSCA,
        status: requiresIFSCA ? 'awaiting_ifsca' : 'admin_approved',
        requested_by: valuation.submitted_by,
        reviewed_by: user.id,
        review_date: new Date().toISOString(),
        admin_approved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (approvalError) {
      console.error('Price approval error:', approvalError);
      return NextResponse.json(
        { error: 'Failed to create price change approval' },
        { status: 500 }
      );
    }

    let priceUpdated = false;

    // If no IFSCA approval needed, update price immediately
    if (!requiresIFSCA) {
      try {
        // Update token price
        await supabaseAdmin
          .from('tokens')
          .update({
            current_price: newPrice,
            price_per_token: newPrice,
            last_price_update: new Date().toISOString(),
            last_valuation_date: valuation.valuation_date,
            next_valuation_due: new Date(new Date(valuation.valuation_date).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            asset_valuation: valuation.valuation_amount,
            asset_valuation_date: valuation.valuation_date,
          })
          .eq('id', valuation.token_id);

        // Create price history record
        const { data: priceHistory } = await supabaseAdmin
          .from('token_price_history')
          .insert({
            token_id: valuation.token_id,
            old_price: oldPrice,
            new_price: newPrice,
            price_type: 'valuation',
            valuation_id: valuationId,
            reason: 'Quarterly valuation update',
            detailed_notes: reviewNotes || null,
            changed_by: user.id,
            approved_by: user.id,
            approval_date: new Date().toISOString(),
            effective_date: new Date().toISOString().split('T')[0],
          })
          .select()
          .single();

        // Update price approval with price history reference
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
          .eq('id', priceApproval.id);

        // Update user holdings values
        await supabaseAdmin.rpc('update_user_holdings_value', {
          p_token_id: valuation.token_id,
          p_new_price: newPrice,
        });

        // Get all token holders for notification
        const { data: holders } = await supabaseAdmin
          .from('user_holdings')
          .select('user_id, quantity')
          .eq('token_id', valuation.token_id)
          .gt('quantity', 0);

        // Create notifications for all holders
        if (holders && holders.length > 0) {
          const notifications = holders.map(holder => ({
            user_id: holder.user_id,
            type: 'price_update',
            title: 'Token Price Updated',
            message: `The price of ${tokenData.token_symbol} has been updated to ₹${newPrice.toFixed(2)} per token (${changePercentage > 0 ? '+' : ''}${changePercentage.toFixed(2)}%)`,
            data: {
              tokenId: valuation.token_id,
              tokenSymbol: tokenData.token_symbol,
              oldPrice,
              newPrice,
              changePercentage,
            },
            status: 'unread',
          }));

          await supabaseAdmin.from('notifications').insert(notifications);

          // Update price history with notification info
          await supabaseAdmin
            .from('token_price_history')
            .update({
              holders_notified: true,
              notification_sent_at: new Date().toISOString(),
              total_holders_notified: holders.length,
            })
            .eq('id', priceHistory?.id);
        }

        priceUpdated = true;

      } catch (priceUpdateError) {
        console.error('Price update error:', priceUpdateError);
        // Continue even if price update fails - can be retried
      }
    } else {
      // Create IFSCA approval alert
      await supabaseAdmin.from('compliance_alerts').insert({
        alert_type: 'ifsca_approval_required',
        severity: 'high',
        title: 'IFSCA Approval Required',
        description: `Price change of ${changePercentage.toFixed(2)}% for ${tokenData.token_symbol} requires IFSCA approval`,
        token_id: valuation.token_id,
        alert_data: {
          valuationId,
          priceApprovalId: priceApproval.id,
          changePercentage,
          oldPrice,
          newPrice,
        },
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
        status: 'active',
      });
    }

    // Log approval
    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'valuation_approved',
      resource_type: 'token_valuation',
      resource_id: valuationId,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      details: {
        tokenId: valuation.token_id,
        tokenSymbol: tokenData.token_symbol,
        valuationAmount: valuation.valuation_amount,
        changePercentage,
        requiresIFSCA,
        priceUpdated,
      },
      severity: 'info',
    });

    // Resolve original compliance alert
    await supabaseAdmin
      .from('compliance_alerts')
      .update({
        status: 'resolved',
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        resolution_notes: requiresIFSCA ? 'Approved - Awaiting IFSCA' : 'Approved - Price updated',
      })
      .eq('alert_data->>valuationId', valuationId)
      .eq('status', 'active');

    return NextResponse.json({
      success: true,
      message: requiresIFSCA 
        ? 'Valuation approved. Awaiting IFSCA approval for price update (>20% change).'
        : 'Valuation approved and price updated successfully.',
      data: {
        valuationId,
        priceApprovalId: priceApproval.id,
        requiresIFSCA,
        priceUpdated,
        oldPrice,
        newPrice,
        changePercentage,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Valuation approval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch pending valuations
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
    const status = searchParams.get('status') || 'pending';

    // Fetch valuations
    const { data: valuations, error } = await supabaseAdmin
      .from('token_valuations')
      .select('*, tokens(token_symbol, token_name, issuer_id, current_price, total_supply)')
      .eq('status', status)
      .order('created_at', { ascending: false });

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
