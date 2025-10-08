/**
 * API Endpoint: Send Message
 * Route: POST /api/rfq/[id]/send-message
 * Purpose: Send messages to bidders (broadcast or individual)
 */

import { createClient } from '@sanctuari/database/lib/server';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const supabase = createClient();
    const { id: rfqId } = await params;
    const { messageText, recipientType, invitationId } = await request.json();

    // Validation
    if (!messageText || !messageText.trim()) {
      return NextResponse.json(
        { error: 'Message text is required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user details
    const { data: userData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Get RFQ details
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select(`
        *,
        rfq_invitations (*)
      `)
      .eq('id', rfqId)
      .single();

    if (rfqError || !rfq) {
      return NextResponse.json(
        { error: 'RFQ not found' },
        { status: 404 }
      );
    }

    // Verify user owns this RFQ
    if (rfq.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - you do not own this RFQ' },
        { status: 403 }
      );
    }

    // Determine recipients
    let recipients = [];
    if (recipientType === 'all') {
      recipients = rfq.rfq_invitations.map(inv => inv.external_email);
    } else if (invitationId) {
      const invitation = rfq.rfq_invitations.find(inv => inv.id === invitationId);
      if (invitation) {
        recipients = [invitation.external_email];
      } else {
        return NextResponse.json(
          { error: 'Invitation not found' },
          { status: 404 }
        );
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients found' },
        { status: 400 }
      );
    }

    // Create message records in database
    const messageRecords = recipients.map(email => ({
      rfq_id: rfqId,
      sender_type: 'client',
      sender_email: user.email,
      sender_name: userData?.full_name || user.user_metadata?.full_name || null,
      message_text: messageText.trim()
    }));

    const { data: messages, error: insertError } = await supabase
      .from('messages')
      .insert(messageRecords)
      .select();

    if (insertError) {
      console.error('[Send Message] Database error:', insertError);
      throw insertError;
    }

    console.log(`[Send Message] Created ${messages.length} message records`);

    // Send email notifications via Brevo
    try {
      await sendEmailNotifications(recipients, messageText, rfq, user);
    } catch (emailError) {
      console.error('[Send Message] Email notification error:', emailError);
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({
      success: true,
      messagesSent: messages.length,
      recipients: recipients.length
    });

  } catch (error) {
    console.error('[Send Message] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

/**
 * Send email notifications to bidders
 */
async function sendEmailNotifications(recipients, message, rfq, user) {
  const brevoApiKey = process.env.BREVO_API_KEY;

  if (!brevoApiKey) {
    console.warn('[Send Message] Brevo API key not configured, skipping email notifications');
    return;
  }

  const emailPromises = recipients.map(async (recipientEmail) => {
    try {
      const emailData = {
        sender: {
          name: 'Sanctuari',
          email: 'noreply@sanctuari.io'
        },
        to: [{
          email: recipientEmail
        }],
        subject: `New message regarding RFQ ${rfq.rfq_number}`,
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #6F4FFF; color: white; padding: 20px; text-align: center; }
              .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
              .message { background: white; padding: 15px; border-left: 4px solid #6F4FFF; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>New Message from ${user.email}</h2>
              </div>
              <div class="content">
                <p><strong>RFQ Number:</strong> ${rfq.rfq_number}</p>
                <p><strong>From:</strong> ${user.email}</p>
                <div class="message">
                  <p><strong>Message:</strong></p>
                  <p>${message.replace(/\n/g, '<br>')}</p>
                </div>
                <p style="margin-top: 20px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://platform.sanctuari.io'}"
                     style="background: #6F4FFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    View RFQ Details
                  </a>
                </p>
              </div>
              <div class="footer">
                <p>This is an automated message from Sanctuari. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': brevoApiKey
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[Send Message] Brevo error for ${recipientEmail}:`, errorData);
      } else {
        console.log(`[Send Message] Email sent to ${recipientEmail}`);
      }

    } catch (error) {
      console.error(`[Send Message] Error sending email to ${recipientEmail}:`, error);
    }
  });

  await Promise.allSettled(emailPromises);
}
