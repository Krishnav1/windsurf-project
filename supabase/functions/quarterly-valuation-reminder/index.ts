/**
 * Supabase Edge Function: Quarterly Valuation Reminder
 * 
 * Runs daily to check for tokens requiring valuation
 * Sends notifications to issuers 15 days before and on due date
 * 
 * Deploy: supabase functions deploy quarterly-valuation-reminder
 * Schedule: Run daily via Supabase cron (pg_cron)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting quarterly valuation reminder check...');

    const today = new Date().toISOString().split('T')[0];
    const fifteenDaysFromNow = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Find tokens requiring valuation
    const { data: tokens, error: tokensError } = await supabase
      .from('tokens')
      .select('id, token_symbol, token_name, issuer_id, next_valuation_due, last_valuation_date')
      .eq('status', 'active')
      .or(`next_valuation_due.lte.${fifteenDaysFromNow},next_valuation_due.is.null`);

    if (tokensError) {
      throw tokensError;
    }

    console.log(`Found ${tokens?.length || 0} tokens to check`);

    const notifications = [];
    const alerts = [];
    let overdueCount = 0;
    let dueSoonCount = 0;

    for (const token of tokens || []) {
      const dueDate = token.next_valuation_due;
      const isOverdue = dueDate && dueDate < today;
      const isDueSoon = dueDate && dueDate <= fifteenDaysFromNow && dueDate >= today;
      const neverValued = !token.last_valuation_date;

      if (isOverdue || neverValued) {
        overdueCount++;
        
        // Create compliance alert
        alerts.push({
          alert_type: 'valuation_overdue',
          severity: 'critical',
          title: 'Valuation Overdue',
          description: `Token ${token.token_symbol} valuation is overdue. Immediate action required.`,
          token_id: token.id,
          user_id: token.issuer_id,
          alert_data: {
            tokenId: token.id,
            tokenSymbol: token.token_symbol,
            dueDate: dueDate || 'Never',
            lastValuationDate: token.last_valuation_date || 'Never',
          },
          deadline: today,
          status: 'active',
        });

        // Create notification
        notifications.push({
          user_id: token.issuer_id,
          type: 'valuation_due',
          title: '🚨 Valuation Overdue',
          message: `Your token ${token.token_symbol} valuation is overdue. Please submit a new valuation report immediately to maintain compliance.`,
          data: {
            tokenId: token.id,
            tokenSymbol: token.token_symbol,
            urgency: 'critical',
            dueDate: dueDate || 'Not set',
          },
          status: 'unread',
        });

      } else if (isDueSoon) {
        dueSoonCount++;
        
        const daysUntilDue = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        // Create compliance alert
        alerts.push({
          alert_type: 'valuation_overdue',
          severity: 'high',
          title: 'Valuation Due Soon',
          description: `Token ${token.token_symbol} valuation is due in ${daysUntilDue} days.`,
          token_id: token.id,
          user_id: token.issuer_id,
          alert_data: {
            tokenId: token.id,
            tokenSymbol: token.token_symbol,
            dueDate,
            daysUntilDue,
          },
          deadline: dueDate,
          status: 'active',
        });

        // Create notification
        notifications.push({
          user_id: token.issuer_id,
          type: 'valuation_due',
          title: '⏰ Valuation Due Soon',
          message: `Your token ${token.token_symbol} valuation is due in ${daysUntilDue} days. Please prepare your valuation report.`,
          data: {
            tokenId: token.id,
            tokenSymbol: token.token_symbol,
            urgency: 'high',
            dueDate,
            daysUntilDue,
          },
          status: 'unread',
        });
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
      // Check for existing active alerts for these tokens
      const tokenIds = alerts.map(a => a.token_id);
      const { data: existingAlerts } = await supabase
        .from('compliance_alerts')
        .select('token_id, alert_type')
        .in('token_id', tokenIds)
        .eq('alert_type', 'valuation_overdue')
        .eq('status', 'active');

      const existingSet = new Set(
        existingAlerts?.map(a => `${a.token_id}-${a.alert_type}`) || []
      );

      const newAlerts = alerts.filter(
        a => !existingSet.has(`${a.token_id}-${a.alert_type}`)
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
      action: 'quarterly_valuation_reminder_executed',
      resource_type: 'system',
      resource_id: null,
      details: {
        tokensChecked: tokens?.length || 0,
        overdueCount,
        dueSoonCount,
        notificationsSent: notifications.length,
        alertsCreated: alerts.length,
      },
      severity: 'info',
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Quarterly valuation reminder executed successfully',
        stats: {
          tokensChecked: tokens?.length || 0,
          overdueCount,
          dueSoonCount,
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
    console.error('Error in quarterly valuation reminder:', error);
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
