/**
 * API Endpoint: Send Automated Reminder Emails
 * Purpose: Cron job to send reminders before deadline to partners who haven't submitted
 * Method: GET (for cron services like Vercel Cron or external schedulers)
 * Schedule: Run daily at 10:00 AM IST
 *
 * Configuration (Vercel Cron):
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/send-reminders",
 *     "schedule": "0 10 * * *"
 *   }]
 * }
 *
 * Or use external cron service like:
 * - cron-job.org
 * - EasyCron
 * - GitHub Actions scheduled workflow
 */

import { createClient } from '@sanctuari/database/lib/server';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Brevo SDK
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export async function GET(request) {
  try {
    const supabase = createClient();

    console.log('[Reminder Cron] Starting reminder check...');

    // Calculate dates
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    // Find RFQs with upcoming deadlines
    const { data: rfqs, error: rfqError } = await supabase
      .from('rfqs')
      .select('*, insurance_products(name), companies(name)')
      .in('status', ['published', 'bidding'])
      .not('deadline', 'is', null)
      .gte('deadline', now.toISOString())
      .lte('deadline', threeDaysFromNow.toISOString());

    if (rfqError) {
      console.error('[Reminder Cron] Error fetching RFQs:', rfqError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!rfqs || rfqs.length === 0) {
      console.log('[Reminder Cron] No RFQs with upcoming deadlines');
      return NextResponse.json({
        success: true,
        message: 'No RFQs with upcoming deadlines',
        sent: 0
      });
    }

    console.log('[Reminder Cron] Found RFQs with deadlines:', rfqs.length);

    let totalSent = 0;
    const results = [];

    // Process each RFQ
    for (const rfq of rfqs) {
      const deadline = new Date(rfq.deadline);
      const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

      // Determine if we should send reminder (3 days or 1 day before)
      const shouldSendReminder = daysUntilDeadline === 3 || daysUntilDeadline === 1;

      if (!shouldSendReminder) {
        continue;
      }

      // Find invitations that haven't submitted yet
      const { data: invitations, error: invError } = await supabase
        .from('rfq_invitations')
        .select('*')
        .eq('rfq_id', rfq.id)
        .neq('status', 'submitted');

      if (invError || !invitations || invitations.length === 0) {
        continue;
      }

      // Filter invitations that haven't received this specific reminder
      const reminderType = daysUntilDeadline === 3 ? '3day' : '1day';
      const invitationsToRemind = invitations.filter(inv => {
        if (!inv.reminders_sent) return true;
        return !inv.reminders_sent.includes(reminderType);
      });

      if (invitationsToRemind.length === 0) {
        console.log(`[Reminder Cron] All invitations for RFQ ${rfq.rfq_number} already reminded`);
        continue;
      }

      console.log(`[Reminder Cron] Sending ${daysUntilDeadline}-day reminders for RFQ ${rfq.rfq_number} to ${invitationsToRemind.length} partners`);

      // Send reminders
      for (const invitation of invitationsToRemind) {
        try {
          const emailSent = await sendReminderEmail(rfq, invitation, daysUntilDeadline);

          if (emailSent) {
            // Update invitation with reminder timestamp
            const reminders = invitation.reminders_sent || [];
            reminders.push(reminderType);

            await supabase
              .from('rfq_invitations')
              .update({
                reminders_sent: reminders,
                last_reminder_at: new Date().toISOString()
              })
              .eq('id', invitation.id);

            totalSent++;
            results.push({
              rfq_number: rfq.rfq_number,
              email: invitation.external_email,
              days_until_deadline: daysUntilDeadline,
              status: 'sent'
            });
          }
        } catch (emailError) {
          console.error('[Reminder Cron] Error sending to:', invitation.external_email, emailError);
          results.push({
            rfq_number: rfq.rfq_number,
            email: invitation.external_email,
            days_until_deadline: daysUntilDeadline,
            status: 'failed',
            error: emailError.message
          });
        }
      }
    }

    console.log(`[Reminder Cron] Complete. Sent ${totalSent} reminders`);

    return NextResponse.json({
      success: true,
      reminders_sent: totalSent,
      results
    });

  } catch (error) {
    console.error('[Reminder Cron] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

async function sendReminderEmail(rfq, invitation, daysUntilDeadline) {
  const deadline = new Date(rfq.deadline);
  const urgencyText = daysUntilDeadline === 1 ? 'tomorrow' : `in ${daysUntilDeadline} days`;
  const urgencyClass = daysUntilDeadline === 1 ? 'urgent' : 'normal';

  const emailData = {
    sender: {
      name: 'Sanctuari',
      email: 'bids@sanctuari.io'
    },
    to: [
      {
        email: invitation.external_email,
        name: invitation.external_email.split('@')[0]
      }
    ],
    subject: `Reminder: Bid Deadline ${urgencyText} - ${rfq.title}`,
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #070921;
      margin: 0;
      padding: 0;
      background-color: #F5F4F5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(7, 9, 33, 0.1);
    }
    .header {
      background: ${daysUntilDeadline === 1 ? '#FD5478' : '#F6C754'};
      color: white;
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 32px 24px;
    }
    .deadline-box {
      background: ${daysUntilDeadline === 1 ? 'rgba(253, 84, 120, 0.1)' : 'rgba(246, 199, 84, 0.1)'};
      border-left: 4px solid ${daysUntilDeadline === 1 ? '#FD5478' : '#F6C754'};
      padding: 16px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .deadline-box strong {
      color: ${daysUntilDeadline === 1 ? '#FD5478' : '#F6C754'};
      font-size: 18px;
    }
    .button {
      display: inline-block;
      background: #6F4FFF;
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 500;
      margin: 24px 0;
    }
    .details {
      background: #F5F4F5;
      padding: 16px;
      border-radius: 8px;
      margin: 24px 0;
    }
    .details p {
      margin: 8px 0;
    }
    .footer {
      background: #F5F4F5;
      padding: 24px;
      text-align: center;
      color: rgba(7, 9, 33, 0.6);
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${daysUntilDeadline === 1 ? '⏰ Urgent Reminder' : '📅 Deadline Approaching'}</h1>
    </div>

    <div class="content">
      <p>Hello,</p>

      <p>This is a friendly reminder that the deadline for submitting your quote is approaching.</p>

      <div class="deadline-box">
        <strong>Deadline: ${urgencyText}</strong><br>
        ${deadline.toLocaleString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>

      <div class="details">
        <p><strong>Bid:</strong> ${rfq.rfq_number}</p>
        <p><strong>Product:</strong> ${rfq.insurance_products?.name || 'Insurance Product'}</p>
        <p><strong>Company:</strong> ${rfq.companies?.name || 'Client Company'}</p>
      </div>

      <p>If you haven't submitted your quote yet, please do so as soon as possible using the link below:</p>

      <center>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://platform.sanctuari.io'}/bid/${invitation.unique_link_token}" class="button">
          Submit Your Quote
        </a>
      </center>

      <p style="margin-top: 24px;">If you have any questions or need an extension, please contact us immediately.</p>

      <p>Best regards,<br>The Sanctuari Team</p>
    </div>

    <div class="footer">
      <p>This is an automated reminder email from Sanctuari</p>
      <p><a href="https://www.sanctuari.io" style="color: #6F4FFF;">www.sanctuari.io</a></p>
    </div>
  </div>
</body>
</html>
    `,
    tags: [`rfq_reminder`, `rfq_${rfq.id}`, `${daysUntilDeadline}_day`]
  };

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Brevo API error: ${error}`);
  }

  return true;
}

// POST method for manual trigger (for testing)
export async function POST(request) {
  // Same logic as GET, but can accept parameters for testing
  return GET(request);
}
