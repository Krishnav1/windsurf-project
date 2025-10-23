/**
 * Razorpay UPI Payment Integration
 * Handles payment order creation, verification, and webhooks
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logError } from '@/lib/utils/errorHandler';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

export interface PaymentOrderParams {
  orderId: string;
  amount: number; // in INR
  userId: string;
  userEmail: string;
  userPhone?: string;
}

export interface PaymentVerificationParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export class RazorpayService {
  
  /**
   * Create a payment order in Razorpay
   */
  static async createPaymentOrder(params: PaymentOrderParams) {
    try {
      console.log('[Razorpay] Creating payment order:', params.orderId);

      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay credentials not configured');
      }

      // Create order in Razorpay
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(params.amount * 100), // Convert to paise
        currency: 'INR',
        receipt: params.orderId,
        notes: {
          user_id: params.userId,
          order_id: params.orderId,
          user_email: params.userEmail
        }
      });

      console.log('[Razorpay] Order created:', razorpayOrder.id);

      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      // Save payment settlement record
      const { error: insertError } = await supabaseAdmin
        .from('payment_settlements')
        .insert({
          order_id: params.orderId,
          user_id: params.userId,
          amount: params.amount,
          payment_method: 'upi',
          payment_gateway: 'razorpay',
          gateway_order_id: razorpayOrder.id,
          status: 'pending',
          metadata: {
            razorpay_order: razorpayOrder,
            created_via: 'api'
          }
        });

      if (insertError) {
        console.error('[Razorpay] Failed to save payment record:', insertError);
        throw insertError;
      }

      // Update order status to payment_pending
      await supabaseAdmin
        .from('orders')
        .update({ 
          status: 'payment_pending',
          payment_method: 'upi'
        })
        .eq('id', params.orderId);

      return {
        success: true,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      };

    } catch (error) {
      console.error('[Razorpay] Order creation failed:', error);
      logError('Razorpay Order Creation', error as Error, params);
      throw error;
    }
  }

  /**
   * Verify payment signature from Razorpay
   */
  static verifyPaymentSignature(params: PaymentVerificationParams): boolean {
    try {
      const body = params.razorpay_order_id + '|' + params.razorpay_payment_id;
      
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body)
        .digest('hex');

      return expectedSignature === params.razorpay_signature;

    } catch (error) {
      console.error('[Razorpay] Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Handle payment success
   */
  static async handlePaymentSuccess(params: PaymentVerificationParams) {
    try {
      console.log('[Razorpay] Processing payment success:', params.razorpay_payment_id);

      // Verify signature
      const isValid = this.verifyPaymentSignature(params);
      if (!isValid) {
        throw new Error('Invalid payment signature');
      }

      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      // Get payment settlement record
      const { data: settlement, error: settlementError } = await supabaseAdmin
        .from('payment_settlements')
        .select('*, orders(*)')
        .eq('gateway_order_id', params.razorpay_order_id)
        .single();

      if (settlementError || !settlement) {
        throw new Error('Payment settlement record not found');
      }

      // Update payment settlement
      await supabaseAdmin
        .from('payment_settlements')
        .update({
          status: 'completed',
          gateway_payment_id: params.razorpay_payment_id,
          gateway_signature: params.razorpay_signature,
          settled_at: new Date().toISOString()
        })
        .eq('id', settlement.id);

      // Update order status
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'payment_confirmed',
          payment_ref: params.razorpay_payment_id,
          payment_timestamp: new Date().toISOString()
        })
        .eq('id', settlement.order_id);

      console.log('[Razorpay] ✅ Payment confirmed for order:', settlement.order_id);

      // Create notification
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: settlement.user_id,
          type: 'payment_success',
          title: 'Payment Successful',
          message: `Your payment of ₹${settlement.amount} has been confirmed. Your order is being processed.`,
          priority: 'high',
          metadata: {
            order_id: settlement.order_id,
            payment_id: params.razorpay_payment_id,
            amount: settlement.amount
          }
        });

      return {
        success: true,
        orderId: settlement.order_id,
        message: 'Payment verified successfully'
      };

    } catch (error) {
      console.error('[Razorpay] Payment success handling failed:', error);
      logError('Razorpay Payment Success', error as Error, params);
      throw error;
    }
  }

  /**
   * Handle payment failure
   */
  static async handlePaymentFailure(razorpayOrderId: string, reason: string) {
    try {
      console.log('[Razorpay] Processing payment failure:', razorpayOrderId);

      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      // Get payment settlement
      const { data: settlement } = await supabaseAdmin
        .from('payment_settlements')
        .select('*')
        .eq('gateway_order_id', razorpayOrderId)
        .single();

      if (!settlement) {
        throw new Error('Payment settlement not found');
      }

      // Update payment settlement
      await supabaseAdmin
        .from('payment_settlements')
        .update({
          status: 'failed',
          error_message: reason
        })
        .eq('id', settlement.id);

      // Update order status
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'failed',
          error_message: `Payment failed: ${reason}`
        })
        .eq('id', settlement.order_id);

      // Create notification
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: settlement.user_id,
          type: 'payment_failed',
          title: 'Payment Failed',
          message: `Your payment failed. Reason: ${reason}. Please try again.`,
          priority: 'high',
          metadata: {
            order_id: settlement.order_id,
            reason: reason
          }
        });

      console.log('[Razorpay] ❌ Payment failed for order:', settlement.order_id);

      return {
        success: false,
        orderId: settlement.order_id,
        message: 'Payment failure recorded'
      };

    } catch (error) {
      console.error('[Razorpay] Payment failure handling error:', error);
      logError('Razorpay Payment Failure', error as Error, { razorpayOrderId, reason });
      throw error;
    }
  }

  /**
   * Handle Razorpay webhook
   */
  static async handleWebhook(payload: any, signature: string) {
    try {
      console.log('[Razorpay] Processing webhook:', payload.event);

      // Verify webhook signature
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== expectedSignature) {
        throw new Error('Invalid webhook signature');
      }

      const event = payload.event;
      const paymentEntity = payload.payload.payment.entity;

      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      // Save webhook data
      const { data: settlement } = await supabaseAdmin
        .from('payment_settlements')
        .select('*')
        .eq('gateway_order_id', paymentEntity.order_id)
        .single();

      if (settlement) {
        await supabaseAdmin
          .from('payment_settlements')
          .update({
            webhook_data: payload,
            webhook_received_at: new Date().toISOString()
          })
          .eq('id', settlement.id);
      }

      // Handle different events
      switch (event) {
        case 'payment.authorized':
        case 'payment.captured':
          await this.handlePaymentSuccess({
            razorpay_order_id: paymentEntity.order_id,
            razorpay_payment_id: paymentEntity.id,
            razorpay_signature: '' // Signature already verified
          });
          break;

        case 'payment.failed':
          await this.handlePaymentFailure(
            paymentEntity.order_id,
            paymentEntity.error_description || 'Payment failed'
          );
          break;

        default:
          console.log('[Razorpay] Unhandled webhook event:', event);
      }

      return { success: true };

    } catch (error) {
      console.error('[Razorpay] Webhook handling failed:', error);
      logError('Razorpay Webhook', error as Error, payload);
      throw error;
    }
  }

  /**
   * Get payment details from Razorpay
   */
  static async getPaymentDetails(paymentId: string) {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      console.error('[Razorpay] Failed to fetch payment:', error);
      throw error;
    }
  }

  /**
   * Initiate refund
   */
  static async initiateRefund(paymentId: string, amount?: number) {
    try {
      console.log('[Razorpay] Initiating refund for payment:', paymentId);

      const refund = await razorpay.payments.refund(paymentId, {
        amount: amount ? Math.round(amount * 100) : undefined, // Full refund if amount not specified
        speed: 'normal'
      });

      if (!supabaseAdmin) {
        throw new Error('Database connection not available');
      }

      // Update payment settlement
      const { data: settlement } = await supabaseAdmin
        .from('payment_settlements')
        .select('*')
        .eq('gateway_payment_id', paymentId)
        .single();

      if (settlement) {
        await supabaseAdmin
          .from('payment_settlements')
          .update({
            status: 'refunded',
            refunded_at: new Date().toISOString(),
            refund_amount: amount || settlement.amount,
            refund_reason: 'Initiated by system',
            metadata: {
              ...settlement.metadata,
              refund: refund
            }
          })
          .eq('id', settlement.id);

        // Create notification
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: settlement.user_id,
            type: 'refund_initiated',
            title: 'Refund Initiated',
            message: `A refund of ₹${amount || settlement.amount} has been initiated. It will be credited to your account within 5-7 business days.`,
            priority: 'normal'
          });
      }

      console.log('[Razorpay] ✅ Refund initiated:', refund.id);

      return refund;

    } catch (error) {
      console.error('[Razorpay] Refund failed:', error);
      logError('Razorpay Refund', error as Error, { paymentId, amount });
      throw error;
    }
  }
}
