/**
 * Notification Service
 * Handles email, SMS, and in-app notifications
 */

import { supabaseAdmin } from '@/lib/supabase/client';

export type NotificationType = 
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'kyc_expired'
  | 'kyc_expiring_30_days'
  | 'kyc_expiring_7_days'
  | 'tokens_frozen'
  | 'tokens_unfrozen'
  | 'investment_limit_warning'
  | 'investment_limit_reached'
  | 'large_transfer_detected'
  | 'compliance_violation'
  | 'recovery_request_approved'
  | 'recovery_request_rejected';

interface NotificationData {
  userId: string;
  type: NotificationType;
  data?: Record<string, any>;
}

class NotificationService {
  /**
   * Send notification via all channels
   */
  async send(notification: NotificationData) {
    if (!supabaseAdmin) {
      throw new Error('Database not configured');
    }

    // Get user details
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email, full_name, phone')
      .eq('id', notification.userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    const message = this.getMessageTemplate(notification.type, user.full_name, notification.data);

    // Send via multiple channels
    await Promise.all([
      this.sendEmail(user.email, message.subject, message.body),
      this.sendInAppNotification(notification.userId, message.subject, message.body),
      // SMS only for urgent notifications
      (notification.type.includes('expiring_7_days') || notification.type.includes('frozen')) 
        ? this.sendSMS(user.phone, message.sms)
        : Promise.resolve()
    ]);
  }

  /**
   * Send email notification
   */
  private async sendEmail(to: string, subject: string, body: string) {
    try {
      // TODO: Implement with SendGrid, Resend, or AWS SES
      // For now, just log
      console.log(`📧 Email to ${to}: ${subject}`);

      // Example with Resend:
      /*
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'TokenPlatform <noreply@tokenplatform.com>',
          to,
          subject,
          html: body
        })
      });
      */
    } catch (error) {
      console.error('Email send error:', error);
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(to: string | null, message: string) {
    if (!to) return;

    try {
      // TODO: Implement with Twilio or AWS SNS
      console.log(`📱 SMS to ${to}: ${message}`);

      // Example with Twilio:
      /*
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          To: to,
          From: process.env.TWILIO_PHONE_NUMBER!,
          Body: message
        })
      });
      */
    } catch (error) {
      console.error('SMS send error:', error);
    }
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(userId: string, title: string, message: string) {
    try {
      if (!supabaseAdmin) return;

      // Store in database (create notifications table if needed)
      await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        title,
        message,
        read: false,
        created_at: new Date().toISOString()
      });

      // TODO: Send via WebSocket for real-time updates
      console.log(`🔔 In-app notification for ${userId}: ${title}`);
    } catch (error) {
      console.error('In-app notification error:', error);
    }
  }

  /**
   * Get message template based on notification type
   */
  private getMessageTemplate(type: NotificationType, userName: string, data?: Record<string, any>) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const templates = {
      kyc_approved: {
        subject: '✅ Your KYC has been Approved!',
        body: `Dear ${userName},\n\nCongratulations! Your KYC verification has been approved.\n\nYou can now:\n- Buy ERC-3643 security tokens\n- Transfer tokens\n- Access all platform features\n\nYour investor category: ${data?.category}\nInvestment limit: ₹${data?.limit?.toLocaleString()}\n\nStart investing: ${appUrl}/dashboard\n\nBest regards,\nTokenPlatform Team`,
        sms: `Your KYC is approved! Category: ${data?.category}. Start investing at ${appUrl}`
      },
      kyc_rejected: {
        subject: '❌ Your KYC has been Rejected',
        body: `Dear ${userName},\n\nUnfortunately, your KYC verification has been rejected.\n\nReason: ${data?.reason}\n\nPlease review the requirements and resubmit with correct documents.\n\nResubmit: ${appUrl}/compliance/kyc-submit\n\nBest regards,\nTokenPlatform Team`,
        sms: `Your KYC was rejected. Reason: ${data?.reason}. Resubmit at ${appUrl}`
      },
      kyc_expired: {
        subject: '🔒 Your KYC has Expired - Tokens Frozen',
        body: `Dear ${userName},\n\nYour KYC verification has expired. Your tokens have been automatically frozen for security.\n\nPlease renew your KYC immediately to regain access.\n\nRenew now: ${appUrl}/compliance/kyc-submit\n\nBest regards,\nTokenPlatform Team`,
        sms: `URGENT: Your KYC expired. Tokens frozen. Renew at ${appUrl}/compliance/kyc-submit`
      },
      kyc_expiring_30_days: {
        subject: '⚠️ Your KYC Expires in 30 Days',
        body: `Dear ${userName},\n\nYour KYC verification will expire on ${data?.expiryDate}.\n\nPlease renew before expiry to avoid token freezing.\n\nRenew now: ${appUrl}/compliance/kyc-submit\n\nBest regards,\nTokenPlatform Team`,
        sms: `Your KYC expires in 30 days. Renew at ${appUrl}`
      },
      kyc_expiring_7_days: {
        subject: '🚨 URGENT: Your KYC Expires in 7 Days',
        body: `Dear ${userName},\n\nYour KYC verification will expire on ${data?.expiryDate}.\n\nThis is your final warning. Renew immediately to avoid token freezing.\n\nRenew now: ${appUrl}/compliance/kyc-submit\n\nBest regards,\nTokenPlatform Team`,
        sms: `URGENT: KYC expires in 7 days! Renew now at ${appUrl}/compliance/kyc-submit`
      },
      tokens_frozen: {
        subject: '🔒 Your Tokens Have Been Frozen',
        body: `Dear ${userName},\n\nYour tokens have been frozen.\n\nAmount: ${data?.amount} tokens\nReason: ${data?.reason}\n\nPlease contact support for assistance.\n\nSupport: ${appUrl}/support/grievance\n\nBest regards,\nTokenPlatform Team`,
        sms: `Your tokens (${data?.amount}) have been frozen. Reason: ${data?.reason}. Contact support.`
      },
      tokens_unfrozen: {
        subject: '✅ Your Tokens Have Been Unfrozen',
        body: `Dear ${userName},\n\nGood news! Your tokens have been unfrozen.\n\nAmount: ${data?.amount} tokens\n\nYou can now transfer your tokens normally.\n\nView portfolio: ${appUrl}/portfolio\n\nBest regards,\nTokenPlatform Team`,
        sms: `Your tokens (${data?.amount}) have been unfrozen. You can now transfer.`
      },
      investment_limit_warning: {
        subject: '⚠️ Investment Limit Warning',
        body: `Dear ${userName},\n\nYou're approaching your investment limit.\n\nCurrent: ₹${data?.current?.toLocaleString()}\nLimit: ₹${data?.limit?.toLocaleString()}\nRemaining: ₹${data?.remaining?.toLocaleString()} (${data?.percentage}%)\n\nView details: ${appUrl}/portfolio\n\nBest regards,\nTokenPlatform Team`,
        sms: `Investment limit warning: ${data?.percentage}% used. ₹${data?.remaining} remaining.`
      },
      investment_limit_reached: {
        subject: '🚫 Investment Limit Reached',
        body: `Dear ${userName},\n\nYou have reached your investment limit.\n\nLimit: ₹${data?.limit?.toLocaleString()}\n\nTo increase your limit, please upgrade your investor category.\n\nContact support: ${appUrl}/support/grievance\n\nBest regards,\nTokenPlatform Team`,
        sms: `Investment limit reached (₹${data?.limit}). Contact support to upgrade.`
      },
      large_transfer_detected: {
        subject: '🔍 Large Transfer Detected',
        body: `Dear ${userName},\n\nA large transfer was detected on your account.\n\nAmount: ${data?.amount} tokens\nTo: ${data?.to}\n\nIf this wasn't you, please contact support immediately.\n\nSupport: ${appUrl}/support/grievance\n\nBest regards,\nTokenPlatform Team`,
        sms: `Large transfer detected: ${data?.amount} tokens. If not you, contact support immediately.`
      },
      compliance_violation: {
        subject: '⚠️ Compliance Violation Detected',
        body: `Dear ${userName},\n\nA compliance violation was detected.\n\nViolation: ${data?.violation}\nAction taken: ${data?.action}\n\nPlease review and correct the issue.\n\nView details: ${appUrl}/dashboard\n\nBest regards,\nTokenPlatform Team`,
        sms: `Compliance violation: ${data?.violation}. Check your dashboard.`
      },
      recovery_request_approved: {
        subject: '✅ Wallet Recovery Request Approved',
        body: `Dear ${userName},\n\nYour wallet recovery request has been approved.\n\nOld wallet: ${data?.oldWallet}\nNew wallet: ${data?.newWallet}\n\nTokens will be transferred within 24 hours.\n\nBest regards,\nTokenPlatform Team`,
        sms: `Wallet recovery approved. Tokens will be transferred to new wallet within 24 hours.`
      },
      recovery_request_rejected: {
        subject: '❌ Wallet Recovery Request Rejected',
        body: `Dear ${userName},\n\nYour wallet recovery request has been rejected.\n\nReason: ${data?.reason}\n\nPlease contact support if you have questions.\n\nSupport: ${appUrl}/support/grievance\n\nBest regards,\nTokenPlatform Team`,
        sms: `Wallet recovery rejected. Reason: ${data?.reason}. Contact support.`
      }
    };

    return templates[type];
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export helper function
export async function sendNotification(userId: string, type: NotificationType, data?: Record<string, any>) {
  return notificationService.send({ userId, type, data });
}
