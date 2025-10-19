/**
 * Verify Payment API
 * Admin verifies payment and triggers token transfer
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyToken } from '@/lib/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Verify admin role
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { orderId, status, notes } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status required' }, { status: 400 });
    }

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('investment_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.payment_status !== 'pending') {
      return NextResponse.json({ 
        error: `Order already ${order.payment_status}` 
      }, { status: 400 });
    }

    // Update payment status
    const { error: updateError } = await supabaseAdmin
      .from('investment_orders')
      .update({
        payment_status: status,
        verified_by: decoded.userId,
        verified_at: new Date().toISOString(),
        notes: notes || null
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // If verified, trigger token transfer
    if (status === 'verified') {
      // Call issuer transfer API
      const transferResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/issuer/transfer-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId })
      });

      if (!transferResponse.ok) {
        console.error('Transfer failed:', await transferResponse.text());
        // Don't fail the verification, just log it
      }
    }

    // Log audit
    await supabaseAdmin.from('audit_logs').insert({
      user_id: decoded.userId,
      action: 'payment_verified',
      resource_type: 'investment_order',
      resource_id: orderId,
      details: { status, notes },
      severity: 'info'
    });

    return NextResponse.json({
      success: true,
      message: `Payment ${status}`,
      orderId
    });

  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
