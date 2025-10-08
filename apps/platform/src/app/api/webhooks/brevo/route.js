/**
 * API Endpoint: Brevo Webhook Handler
 * Purpose: Receive and process email tracking events from Brevo
 * Method: POST
 * Events: delivered, opened, clicked, bounced, spam, unsubscribed
 *
 * Brevo Webhook Configuration:
 * 1. Go to Brevo dashboard → Transactional → Settings → Webhooks
 * 2. Add webhook URL: https://platform.sanctuari.io/api/webhooks/brevo
 * 3. Enable events: delivered, opened, clicked, bounced, spam
 * 4. Save and activate
 */

import { createClient } from '@sanctuari/database/lib/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    console.log('[Brevo Webhook] Received event:', body.event, {
      email: body.email,
      messageId: body['message-id'],
      tag: body.tag
    });

    // Extract event data
    const event = body.event; // 'delivered', 'opened', 'click', 'bounced', 'spam', etc.
    const email = body.email;
    const messageId = body['message-id'];
    const timestamp = body.ts || body.date || new Date().toISOString();
    const tag = body.tag; // We'll use tags to store invitation IDs

    // Validate required fields
    if (!event || !email) {
      console.error('[Brevo Webhook] Missing required fields:', { event, email });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the invitation by email (and optionally by tag if we store invitation ID in tag)
    const { data: invitations, error: fetchError } = await supabase
      .from('rfq_invitations')
      .select('*')
      .eq('external_email', email)
      .order('sent_at', { ascending: false });

    if (fetchError) {
      console.error('[Brevo Webhook] Error fetching invitation:', fetchError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!invitations || invitations.length === 0) {
      console.log('[Brevo Webhook] No invitation found for email:', email);
      // Return 200 to acknowledge receipt (not an error)
      return NextResponse.json({ success: true, message: 'No invitation found' });
    }

    // Update all matching invitations (in case of multiple bids to same email)
    const updatePromises = invitations.map(async (invitation) => {
      const updates = {};

      // Map Brevo events to our invitation statuses
      switch (event) {
        case 'delivered':
          // Email successfully delivered to inbox
          updates.delivered_at = timestamp;
          break;

        case 'opened':
        case 'open':
          // Email opened by recipient
          if (invitation.status === 'sent') {
            updates.status = 'opened';
          }
          updates.opened_at = timestamp;
          break;

        case 'click':
        case 'clicked':
          // Link clicked in email (unique bid link)
          if (invitation.status === 'sent') {
            updates.status = 'opened';
          }
          updates.opened_at = updates.opened_at || timestamp;
          updates.clicked_at = timestamp;
          break;

        case 'bounce':
        case 'hard_bounce':
        case 'soft_bounce':
          // Email bounced
          updates.status = 'expired';
          updates.bounce_reason = body.reason || 'Email bounced';
          break;

        case 'spam':
        case 'complaint':
          // Marked as spam
          updates.status = 'expired';
          updates.bounce_reason = 'Marked as spam';
          break;

        case 'unsubscribed':
          // Unsubscribed from emails
          updates.status = 'expired';
          updates.bounce_reason = 'Unsubscribed';
          break;

        case 'blocked':
        case 'invalid_email':
          // Invalid email or blocked
          updates.status = 'expired';
          updates.bounce_reason = body.reason || 'Email blocked or invalid';
          break;

        default:
          console.log('[Brevo Webhook] Unhandled event type:', event);
      }

      // Update invitation if we have changes
      if (Object.keys(updates).length > 0) {
        console.log('[Brevo Webhook] Updating invitation:', invitation.id, updates);

        const { error: updateError } = await supabase
          .from('rfq_invitations')
          .update(updates)
          .eq('id', invitation.id);

        if (updateError) {
          console.error('[Brevo Webhook] Error updating invitation:', updateError);
          return { success: false, error: updateError };
        }

        return { success: true, invitation_id: invitation.id };
      }

      return { success: true, message: 'No updates needed' };
    });

    const results = await Promise.all(updatePromises);
    const successCount = results.filter(r => r.success).length;

    console.log('[Brevo Webhook] Updated invitations:', successCount);

    // Also update email_logs table if it exists
    try {
      await supabase
        .from('email_logs')
        .update({
          status: event === 'delivered' ? 'delivered' :
                  event === 'bounced' || event === 'hard_bounce' || event === 'soft_bounce' ? 'bounced' :
                  'sent',
          delivered_at: event === 'delivered' ? timestamp : null,
          opened_at: (event === 'opened' || event === 'open' || event === 'click') ? timestamp : null,
          error_message: (event === 'bounced' || event === 'spam') ? body.reason : null
        })
        .eq('recipient_email', email)
        .eq('brevo_message_id', messageId);
    } catch (emailLogError) {
      // Non-critical error, just log it
      console.log('[Brevo Webhook] Could not update email_logs:', emailLogError);
    }

    return NextResponse.json({
      success: true,
      event,
      email,
      invitations_updated: successCount
    });

  } catch (error) {
    console.error('[Brevo Webhook] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification (some services require this)
export async function GET(request) {
  return NextResponse.json({
    service: 'Brevo Webhook Handler',
    status: 'active',
    endpoints: {
      POST: '/api/webhooks/brevo'
    },
    events_supported: [
      'delivered',
      'opened',
      'clicked',
      'bounced',
      'spam',
      'unsubscribed',
      'blocked',
      'invalid_email'
    ]
  });
}
