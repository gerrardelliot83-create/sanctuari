/**
 * API Endpoint: Resend Invitation
 * Purpose: Resend bid invitation email to a specific partner
 * Method: POST
 * Body: { invitationId: string }
 */

import { createClient } from '@sanctuari/database/lib/server';
import { NextResponse } from 'next/server';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export async function POST(request, { params }) {
  try {
    const supabase = createClient();
    const rfqId = params.id;
    const { invitationId } = await request.json();

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    console.log('[Resend Invitation] Resending invitation:', invitationId);

    // Get invitation details
    const { data: invitation, error: invError } = await supabase
      .from('rfq_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('rfq_id', rfqId)
      .single();

    if (invError || !invitation) {
      console.error('[Resend Invitation] Invitation not found:', invError);
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired. Please extend the deadline first.' },
        { status: 400 }
      );
    }

    // Get RFQ details
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select(`
        *,
        insurance_products (name),
        companies (name)
      `)
      .eq('id', rfqId)
      .single();

    if (rfqError || !rfq) {
      console.error('[Resend Invitation] RFQ not found:', rfqError);
      return NextResponse.json(
        { error: 'Bid not found' },
        { status: 404 }
      );
    }

    // Send email via Brevo
    const deadline = rfq.deadline ? new Date(rfq.deadline) : null;
    const bidLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://platform.sanctuari.io'}/bid/${invitation.unique_link_token}`;

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
      subject: `[Resent] Bid Invitation - ${rfq.title}`,
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
      background: linear-gradient(135deg, #6F4FFF 0%, #5A3FE5 100%);
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
    .resend-notice {
      background: rgba(246, 199, 84, 0.1);
      border-left: 4px solid #F6C754;
      padding: 12px 16px;
      margin-bottom: 24px;
      border-radius: 8px;
      font-size: 14px;
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
    .deadline {
      background: rgba(253, 84, 120, 0.1);
      border: 1px solid #FD5478;
      padding: 12px 16px;
      border-radius: 8px;
      margin: 16px 0;
      text-align: center;
      font-weight: 500;
      color: #FD5478;
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
      <h1>📧 Bid Invitation (Resent)</h1>
    </div>

    <div class="content">
      <div class="resend-notice">
        This is a resent invitation. Your original invitation link is still valid.
      </div>

      <p>Hello,</p>

      <p>You're invited to submit a quote for the following insurance requirement:</p>

      <div class="details">
        <p><strong>Bid Number:</strong> ${rfq.rfq_number || 'Pending'}</p>
        <p><strong>Product:</strong> ${rfq.insurance_products?.name || 'Insurance Product'}</p>
        <p><strong>Company:</strong> ${rfq.companies?.name || 'Client Company'}</p>
      </div>

      ${deadline ? `
      <div class="deadline">
        ⏰ Submission Deadline: ${deadline.toLocaleString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
      ` : ''}

      <center>
        <a href="${bidLink}" class="button">
          Submit Your Quote
        </a>
      </center>

      <p style="margin-top: 24px; font-size: 14px; color: rgba(7, 9, 33, 0.7);">
        <strong>Note:</strong> This link is unique to you and expires on the deadline date. Please submit your quote before the deadline to be considered.
      </p>

      <p>If you have any questions, please reply to this email.</p>

      <p>Best regards,<br>The Sanctuari Team</p>
    </div>

    <div class="footer">
      <p>Powered by Sanctuari</p>
      <p><a href="https://www.sanctuari.io" style="color: #6F4FFF;">www.sanctuari.io</a></p>
    </div>
  </div>
</body>
</html>
      `,
      tags: [`rfq_resend`, `rfq_${rfq.id}`, `invitation_${invitation.id}`]
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
      console.error('[Resend Invitation] Brevo error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    const brevoResponse = await response.json();

    // Update invitation with resend timestamp
    const { error: updateError } = await supabase
      .from('rfq_invitations')
      .update({
        sent_at: new Date().toISOString(), // Update to latest resend time
        status: 'sent' // Reset status to sent
      })
      .eq('id', invitationId);

    if (updateError) {
      console.error('[Resend Invitation] Error updating invitation:', updateError);
    }

    // Log email send
    try {
      await supabase
        .from('email_logs')
        .insert({
          rfq_id: rfqId,
          invitation_id: invitationId,
          recipient_email: invitation.external_email,
          subject: `[Resent] Bid Invitation - ${rfq.title}`,
          template_name: 'resend_invitation',
          status: 'sent',
          brevo_message_id: brevoResponse.messageId,
          sent_at: new Date().toISOString()
        });
    } catch (logError) {
      console.log('[Resend Invitation] Could not log email:', logError);
    }

    console.log('[Resend Invitation] Email sent successfully to:', invitation.external_email);

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully',
      email: invitation.external_email
    });

  } catch (error) {
    console.error('[Resend Invitation] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
