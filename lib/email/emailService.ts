/**
 * Email Service using Resend
 * Handles all email notifications for the platform
 */

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@tokenplatform.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  /**
   * Send email using Resend
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!resend) {
      console.warn('Resend not configured. Email not sent:', options.subject);
      return false;
    }

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log(`Email sent to ${options.to}: ${options.subject}`);
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  /**
   * Send valuation submitted notification to admin
   */
  static async sendValuationSubmittedToAdmin(
    adminEmail: string,
    tokenSymbol: string,
    tokenName: string,
    valuationAmount: number,
    issuerName: string,
    valuationId: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0B67FF; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .button { display: inline-block; background: #0B67FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New Valuation Submitted</h1>
          </div>
          <div class="content">
            <h2>Valuation Pending Review</h2>
            <p><strong>Token:</strong> ${tokenSymbol} - ${tokenName}</p>
            <p><strong>Valuation Amount:</strong> ₹${valuationAmount.toLocaleString()}</p>
            <p><strong>Submitted By:</strong> ${issuerName}</p>
            <p><strong>Status:</strong> Pending Admin Review</p>
            <p>A new quarterly valuation has been submitted and requires your review.</p>
            <a href="${APP_URL}/admin/valuations?id=${valuationId}" class="button">Review Valuation</a>
          </div>
          <div class="footer">
            <p>This is an automated notification from TokenPlatform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `New Valuation Submitted - ${tokenSymbol}`,
      html,
    });
  }

  /**
   * Send valuation approved notification to issuer
   */
  static async sendValuationApprovedToIssuer(
    issuerEmail: string,
    tokenSymbol: string,
    tokenName: string,
    valuationAmount: number,
    newPrice: number,
    changePercentage: number
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .success { background: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 15px 0; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Valuation Approved</h1>
          </div>
          <div class="content">
            <div class="success">
              <h2>Your valuation has been approved!</h2>
            </div>
            <p><strong>Token:</strong> ${tokenSymbol} - ${tokenName}</p>
            <p><strong>Valuation Amount:</strong> ₹${valuationAmount.toLocaleString()}</p>
            <p><strong>New Token Price:</strong> ₹${newPrice.toFixed(2)}</p>
            <p><strong>Price Change:</strong> ${changePercentage >= 0 ? '+' : ''}${changePercentage.toFixed(2)}%</p>
            <p>The token price has been updated and all holders have been notified.</p>
            <a href="${APP_URL}/issuer/valuations" class="button">View Valuation History</a>
          </div>
          <div class="footer">
            <p>This is an automated notification from TokenPlatform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: issuerEmail,
      subject: `Valuation Approved - ${tokenSymbol}`,
      html,
    });
  }

  /**
   * Send valuation rejected notification to issuer
   */
  static async sendValuationRejectedToIssuer(
    issuerEmail: string,
    tokenSymbol: string,
    tokenName: string,
    rejectionReason: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .error { background: #FEE2E2; border-left: 4px solid #EF4444; padding: 15px; margin: 15px 0; }
          .button { display: inline-block; background: #0B67FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Valuation Rejected</h1>
          </div>
          <div class="content">
            <div class="error">
              <h2>Your valuation submission was rejected</h2>
            </div>
            <p><strong>Token:</strong> ${tokenSymbol} - ${tokenName}</p>
            <p><strong>Reason:</strong></p>
            <p>${rejectionReason || 'No specific reason provided'}</p>
            <p>Please review the feedback and submit a revised valuation.</p>
            <a href="${APP_URL}/issuer/valuations" class="button">Submit New Valuation</a>
          </div>
          <div class="footer">
            <p>This is an automated notification from TokenPlatform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: issuerEmail,
      subject: `Valuation Rejected - ${tokenSymbol}`,
      html,
    });
  }

  /**
   * Send price update notification to token holder
   */
  static async sendPriceUpdateToHolder(
    holderEmail: string,
    holderName: string,
    tokenSymbol: string,
    oldPrice: number,
    newPrice: number,
    changePercentage: number,
    holdingQuantity: number
  ): Promise<boolean> {
    const oldValue = oldPrice * holdingQuantity;
    const newValue = newPrice * holdingQuantity;
    const valueChange = newValue - oldValue;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0B67FF; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .highlight { background: ${changePercentage >= 0 ? '#D1FAE5' : '#FEE2E2'}; border-left: 4px solid ${changePercentage >= 0 ? '#10B981' : '#EF4444'}; padding: 15px; margin: 15px 0; }
          .button { display: inline-block; background: #0B67FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Token Price Updated</h1>
          </div>
          <div class="content">
            <p>Hello ${holderName},</p>
            <p>The price of <strong>${tokenSymbol}</strong> has been updated based on the latest quarterly valuation.</p>
            <div class="highlight">
              <p><strong>Old Price:</strong> ₹${oldPrice.toFixed(2)} per token</p>
              <p><strong>New Price:</strong> ₹${newPrice.toFixed(2)} per token</p>
              <p><strong>Change:</strong> ${changePercentage >= 0 ? '+' : ''}${changePercentage.toFixed(2)}%</p>
            </div>
            <p><strong>Your Holdings:</strong></p>
            <p>Quantity: ${holdingQuantity.toLocaleString()} tokens</p>
            <p>Previous Value: ₹${oldValue.toLocaleString()}</p>
            <p>Current Value: ₹${newValue.toLocaleString()}</p>
            <p>Value Change: ${valueChange >= 0 ? '+' : ''}₹${Math.abs(valueChange).toLocaleString()}</p>
            <a href="${APP_URL}/investor/portfolio" class="button">View Portfolio</a>
          </div>
          <div class="footer">
            <p>This is an automated notification from TokenPlatform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: holderEmail,
      subject: `Price Update: ${tokenSymbol} ${changePercentage >= 0 ? '📈' : '📉'}`,
      html,
    });
  }

  /**
   * Send valuation reminder to issuer
   */
  static async sendValuationReminder(
    issuerEmail: string,
    tokenSymbol: string,
    tokenName: string,
    dueDate: string,
    daysUntilDue: number
  ): Promise<boolean> {
    const isOverdue = daysUntilDue < 0;
    const urgency = isOverdue ? 'OVERDUE' : daysUntilDue <= 7 ? 'URGENT' : 'REMINDER';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${isOverdue ? '#EF4444' : '#F59E0B'}; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 15px 0; }
          .button { display: inline-block; background: #0B67FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isOverdue ? '🚨' : '⏰'} Valuation ${urgency}</h1>
          </div>
          <div class="content">
            <div class="warning">
              <h2>${isOverdue ? 'Valuation Overdue!' : 'Valuation Due Soon'}</h2>
            </div>
            <p><strong>Token:</strong> ${tokenSymbol} - ${tokenName}</p>
            <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${isOverdue ? `Overdue by ${Math.abs(daysUntilDue)} days` : `Due in ${daysUntilDue} days`}</p>
            <p>${isOverdue 
              ? 'Your quarterly valuation is overdue. Please submit immediately to maintain IFSCA compliance.' 
              : 'Your quarterly valuation is due soon. Please prepare and submit your valuation report.'
            }</p>
            <a href="${APP_URL}/issuer/valuations" class="button">Submit Valuation Now</a>
          </div>
          <div class="footer">
            <p>This is an automated notification from TokenPlatform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: issuerEmail,
      subject: `${urgency}: Quarterly Valuation for ${tokenSymbol}`,
      html,
    });
  }
}
