/**
 * Supabase Edge Function: Document Expiry Checker
 * 
 * Runs daily to check for expiring/expired documents
 * Sends reminders 30 days, 15 days, 7 days before expiry
 * Auto-suspends tokens with expired critical documents
 * 
 * Deploy: supabase functions deploy document-expiry-checker
 * Schedule: Run daily via Supabase cron (pg_cron)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting document expiry check...');

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Find documents expiring soon or already expired
    const { data: documents, error: docsError } = await supabase
      .from('issuer_documents')
      .select('*, tokens(id, token_symbol, issuer_id, status)')
      .not('expires_at', 'is', null)
      .lte('expires_at', thirtyDaysFromNow)
      .eq('is_latest_version', true)
      .neq('status', 'rejected');

    if (docsError) {
      throw docsError;
    }

    console.log(`Found ${documents?.length || 0} documents to check`);

    const notifications = [];
    const alerts = [];
    const tokensToSuspend = new Set<string>();
    let expiredCount = 0;
    let expiringSoonCount = 0;

    for (const doc of documents || []) {
      const expiryDate = doc.expires_at;
      const daysUntilExpiry = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = daysUntilExpiry < 0;
      const isCritical = doc.is_critical;

      if (isExpired) {
        expiredCount++;

        // Create critical alert for expired documents
        alerts.push({
          alert_type: 'document_expired',
          severity: isCritical ? 'critical' : 'high',
          title: `${isCritical ? 'Critical ' : ''}Document Expired`,
          description: `${doc.document_type} for token ${doc.tokens?.token_symbol} has expired.`,
          token_id: doc.token_id,
          user_id: doc.issuer_id,
          document_id: doc.id,
          alert_data: {
            documentId: doc.id,
            documentType: doc.document_type,
            tokenId: doc.token_id,
            tokenSymbol: doc.tokens?.token_symbol,
            expiryDate,
            daysOverdue: Math.abs(daysUntilExpiry),
            isCritical,
          },
          deadline: today,
          status: 'active',
        });

        // Create notification
        notifications.push({
          user_id: doc.issuer_id,
          type: 'document_expiring',
          title: `🚨 ${isCritical ? 'Critical ' : ''}Document Expired`,
          message: `Your ${doc.document_type} for token ${doc.tokens?.token_symbol} has expired ${Math.abs(daysUntilExpiry)} days ago. ${isCritical ? 'This may affect token compliance.' : 'Please renew immediately.'}`,
          data: {
            documentId: doc.id,
            documentType: doc.document_type,
            tokenId: doc.token_id,
            tokenSymbol: doc.tokens?.token_symbol,
            urgency: 'critical',
            expiryDate,
            isCritical,
          },
          status: 'unread',
        });

        // Mark critical expired documents for token suspension
        if (isCritical && doc.tokens?.status === 'active') {
          tokensToSuspend.add(doc.token_id);
        }

      } else if (daysUntilExpiry <= 30) {
        expiringSoonCount++;

        // Determine severity based on days remaining
        let severity: 'low' | 'medium' | 'high' = 'low';
        let urgency = 'low';
        if (daysUntilExpiry <= 7) {
          severity = 'high';
          urgency = 'high';
        } else if (daysUntilExpiry <= 15) {
          severity = 'medium';
          urgency = 'medium';
        }

        // Only send reminder if not already sent for this threshold
        const shouldSendReminder = 
          (daysUntilExpiry <= 7 && !doc.expiry_reminder_sent) ||
          (daysUntilExpiry <= 15 && !doc.expiry_reminder_sent) ||
          (daysUntilExpiry <= 30 && !doc.expiry_reminder_sent);

        if (shouldSendReminder) {
          // Create alert
          alerts.push({
            alert_type: 'document_expiring',
            severity,
            title: 'Document Expiring Soon',
            description: `${doc.document_type} for token ${doc.tokens?.token_symbol} expires in ${daysUntilExpiry} days.`,
            token_id: doc.token_id,
            user_id: doc.issuer_id,
            document_id: doc.id,
            alert_data: {
              documentId: doc.id,
              documentType: doc.document_type,
              tokenId: doc.token_id,
              tokenSymbol: doc.tokens?.token_symbol,
              expiryDate,
              daysUntilExpiry,
              isCritical,
            },
            deadline: expiryDate,
            status: 'active',
          });

          // Create notification
          notifications.push({
            user_id: doc.issuer_id,
            type: 'document_expiring',
            title: `⏰ Document Expiring in ${daysUntilExpiry} Days`,
            message: `Your ${doc.document_type} for token ${doc.tokens?.token_symbol} will expire on ${new Date(expiryDate).toLocaleDateString()}. ${isCritical ? 'This is a critical document.' : 'Please renew before expiry.'}`,
            data: {
              documentId: doc.id,
              documentType: doc.document_type,
              tokenId: doc.token_id,
              tokenSymbol: doc.tokens?.token_symbol,
              urgency,
              expiryDate,
              daysUntilExpiry,
              isCritical,
            },
            status: 'unread',
          });

          // Mark reminder as sent
          await supabase
            .from('issuer_documents')
            .update({
              expiry_reminder_sent: true,
              expiry_reminder_sent_at: new Date().toISOString(),
            })
            .eq('id', doc.id);
        }
      }
    }

    // Suspend tokens with expired critical documents
    if (tokensToSuspend.size > 0) {
      const tokenIdsToSuspend = Array.from(tokensToSuspend);
      
      const { error: suspendError } = await supabase
        .from('tokens')
        .update({
          compliance_status: 'non_compliant',
          compliance_notes: 'Token suspended due to expired critical documents',
        })
        .in('id', tokenIdsToSuspend);

      if (suspendError) {
        console.error('Token suspension error:', suspendError);
      } else {
        console.log(`Suspended ${tokenIdsToSuspend.length} tokens due to expired critical documents`);
      }

      // Create suspension alerts
      for (const tokenId of tokenIdsToSuspend) {
        const token = documents.find(d => d.token_id === tokenId)?.tokens;
        if (token) {
          alerts.push({
            alert_type: 'compliance_violation',
            severity: 'critical',
            title: 'Token Suspended - Expired Documents',
            description: `Token ${token.token_symbol} has been marked non-compliant due to expired critical documents.`,
            token_id: tokenId,
            user_id: token.issuer_id,
            alert_data: {
              tokenId,
              tokenSymbol: token.token_symbol,
              reason: 'expired_critical_documents',
            },
            status: 'active',
          });
        }
      }
    }

    // Insert notifications
    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Notification insert error:', notifError);
      } else {
        console.log(`Created ${notifications.length} notifications`);
      }
    }

    // Insert compliance alerts (avoid duplicates)
    if (alerts.length > 0) {
      const documentIds = alerts.filter(a => a.document_id).map(a => a.document_id);
      const { data: existingAlerts } = await supabase
        .from('compliance_alerts')
        .select('document_id, alert_type')
        .in('document_id', documentIds)
        .in('alert_type', ['document_expired', 'document_expiring'])
        .eq('status', 'active');

      const existingSet = new Set(
        existingAlerts?.map(a => `${a.document_id}-${a.alert_type}`) || []
      );

      const newAlerts = alerts.filter(
        a => !a.document_id || !existingSet.has(`${a.document_id}-${a.alert_type}`)
      );

      if (newAlerts.length > 0) {
        const { error: alertError } = await supabase
          .from('compliance_alerts')
          .insert(newAlerts);

        if (alertError) {
          console.error('Alert insert error:', alertError);
        } else {
          console.log(`Created ${newAlerts.length} compliance alerts`);
        }
      }
    }

    // Log execution
    await supabase.from('audit_logs').insert({
      user_id: null,
      action: 'document_expiry_checker_executed',
      resource_type: 'system',
      resource_id: null,
      details: {
        documentsChecked: documents?.length || 0,
        expiredCount,
        expiringSoonCount,
        tokensSuspended: tokensToSuspend.size,
        notificationsSent: notifications.length,
        alertsCreated: alerts.length,
      },
      severity: 'info',
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Document expiry checker executed successfully',
        stats: {
          documentsChecked: documents?.length || 0,
          expiredCount,
          expiringSoonCount,
          tokensSuspended: tokensToSuspend.size,
          notificationsSent: notifications.length,
          alertsCreated: alerts.length,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in document expiry checker:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
