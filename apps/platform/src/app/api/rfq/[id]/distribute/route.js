/**
 * API: Distribute RFQ
 * POST /api/rfq/[id]/distribute
 * Purpose: Send RFQ invitations to insurers/brokers via email
 */

import { NextResponse } from 'next/server';
import { createClient } from '@sanctuari/database/lib/server';
import { generateUniqueToken } from '@sanctuari/utils/generators';
import { sendInvitationEmail } from '@sanctuari/utils/email/brevo';

export async function POST(request, { params }) {
  try {
    const supabase = createClient();

    // Verify authentication using server client
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Unwrap params for Next.js 15+
    const resolvedParams = await Promise.resolve(params);
    const rfqId = resolvedParams.id;

    // Parse request body
    const body = await request.json();
    const { recipients, expiryDays, deadline, templateId } = body;

    // Validate inputs
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient is required' },
        { status: 400 }
      );
    }

    if (!deadline) {
      return NextResponse.json(
        { error: 'Submission deadline is required' },
        { status: 400 }
      );
    }

    if (!expiryDays || expiryDays < 1 || expiryDays > 90) {
      return NextResponse.json(
        { error: 'Expiry days must be between 1 and 90' },
        { status: 400 }
      );
    }

    // Load RFQ with related data
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select(`
        *,
        insurance_products (name),
        companies (name)
      `)
      .eq('id', rfqId)
      .eq('user_id', user.id)
      .single();

    if (rfqError || !rfq) {
      console.error('[Distribute API] RFQ not found:', rfqError);
      return NextResponse.json(
        { error: 'RFQ not found or access denied' },
        { status: 404 }
      );
    }

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Process each recipient
    const results = {
      success: [],
      failed: []
    };

    for (const recipient of recipients) {
      try {
        // Generate unique token for this invitation
        const token = generateUniqueToken();

        // Create invitation record
        const { data: invitation, error: invitationError } = await supabase
          .from('rfq_invitations')
          .insert({
            rfq_id: rfqId,
            network_member_id: recipient.networkMemberId || null,
            external_email: recipient.email,
            unique_link_token: token,
            status: 'sent',
            expires_at: expiresAt.toISOString(),
            sent_at: new Date().toISOString()
          })
          .select()
          .single();

        if (invitationError) {
          console.error('[Distribute API] Invitation creation failed:', invitationError);
          results.failed.push({
            email: recipient.email,
            error: 'Failed to create invitation record'
          });
          continue;
        }

        // Send email via Brevo
        const emailResult = await sendInvitationEmail({
          to: recipient.email,
          contactPerson: recipient.contactPerson || null,
          rfq: {
            id: rfq.id,
            rfq_number: rfq.rfq_number,
            product_name: rfq.insurance_products?.name || rfq.title,
            company_name: rfq.companies?.name || 'the requesting company',
            title: rfq.title
          },
          token: token,
          expiresAt: expiresAt,
          deadline: new Date(deadline),
          templateId: templateId || 'standard'
        });

        // Log email delivery
        await supabase
          .from('email_logs')
          .insert({
            rfq_id: rfqId,
            invitation_id: invitation.id,
            recipient_email: recipient.email,
            subject: `Invitation to bid on ${rfq.rfq_number}`,
            template_name: templateId || 'standard',
            status: emailResult.success ? 'sent' : 'failed',
            brevo_message_id: emailResult.messageId,
            error_message: emailResult.error,
            sent_at: new Date().toISOString()
          });

        if (emailResult.success) {
          results.success.push({
            email: recipient.email,
            invitationId: invitation.id,
            messageId: emailResult.messageId
          });
        } else {
          results.failed.push({
            email: recipient.email,
            error: emailResult.error
          });

          // Update invitation status to reflect email failure
          await supabase
            .from('rfq_invitations')
            .update({ status: 'expired' })
            .eq('id', invitation.id);
        }

      } catch (recipientError) {
        console.error('[Distribute API] Recipient processing error:', recipientError);
        results.failed.push({
          email: recipient.email,
          error: recipientError.message || 'Unknown error'
        });
      }
    }

    // Update RFQ status to 'bidding' if at least one invitation was sent successfully
    if (results.success.length > 0) {
      await supabase
        .from('rfqs')
        .update({
          status: 'bidding',
          published_at: new Date().toISOString(),
          deadline: new Date(deadline).toISOString()
        })
        .eq('id', rfqId);
    }

    // Return summary
    return NextResponse.json({
      success: true,
      summary: {
        total: recipients.length,
        sent: results.success.length,
        failed: results.failed.length
      },
      results: {
        success: results.success,
        failed: results.failed
      }
    });

  } catch (error) {
    console.error('[Distribute API] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
