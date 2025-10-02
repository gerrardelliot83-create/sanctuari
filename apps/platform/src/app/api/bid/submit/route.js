/**
 * API Endpoint: Bid Submission
 * Purpose: Accept and process bid submissions from insurers/brokers
 * Method: POST
 * Auth: Public (token-based validation)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    // Create Supabase client with service role (bypasses RLS for public bid submission)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { invitationId, token, bidData, documents } = await request.json();

    console.log('[Bid Submission] Received request:', {
      invitationId,
      token: token?.substring(0, 8) + '...',
      bidData: {
        company: bidData?.bidder_company_name,
        email: bidData?.bidder_email,
      },
      documentCount: documents?.length || 0,
    });

    // Validation
    if (!invitationId || !token || !bidData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Verify invitation token is valid and not expired
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('rfq_invitations')
      .select('*')
      .eq('unique_link_token', token)
      .eq('id', invitationId)
      .single();

    if (invitationError || !invitation) {
      console.error('[Bid Submission] Invalid invitation:', invitationError);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invitation token' },
        { status: 400 }
      );
    }

    // Check if already submitted
    if (invitation.status === 'submitted') {
      console.log('[Bid Submission] Already submitted:', invitationId);
      return NextResponse.json(
        { success: false, error: 'Quote already submitted for this invitation' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > new Date(invitation.expires_at)) {
      console.log('[Bid Submission] Invitation expired:', {
        invitationId,
        expiresAt: invitation.expires_at,
      });
      return NextResponse.json(
        { success: false, error: 'Invitation link has expired' },
        { status: 400 }
      );
    }

    // 2. Create bid record
    const { data: bid, error: bidError } = await supabaseAdmin
      .from('bids')
      .insert({
        rfq_id: invitation.rfq_id,
        invitation_id: invitation.id,
        bidder_company_name: bidData.bidder_company_name,
        bidder_contact_person: bidData.bidder_contact_person || null,
        bidder_email: bidData.bidder_email,
        bidder_phone: bidData.bidder_phone || null,
        premium_amount: bidData.premium_amount,
        coverage_amount: bidData.coverage_amount,
        deductible: bidData.deductible || null,
        policy_term_months: bidData.policy_term_months || 12,
        additional_terms: bidData.additional_terms || null,
        status: 'submitted',
      })
      .select()
      .single();

    if (bidError) {
      console.error('[Bid Submission] Failed to create bid:', bidError);
      return NextResponse.json(
        { success: false, error: 'Failed to create bid record' },
        { status: 500 }
      );
    }

    console.log('[Bid Submission] Bid created successfully:', bid.id);

    // 3. Create document records
    if (documents && documents.length > 0) {
      const documentRecords = documents.map(doc => ({
        bid_id: bid.id,
        file_name: doc.file_name,
        file_url: doc.file_url,
        file_type: doc.file_type,
        file_size_bytes: doc.file_size_bytes || null,
        parsed_data: doc.parsed_data || null,
      }));

      const { error: docsError } = await supabaseAdmin
        .from('bid_documents')
        .insert(documentRecords);

      if (docsError) {
        console.error('[Bid Submission] Failed to create documents:', docsError);
        // Don't fail the entire submission if documents fail
      } else {
        console.log('[Bid Submission] Documents created:', documentRecords.length);
      }
    }

    // 4. Update invitation status to 'submitted'
    const { error: updateError } = await supabaseAdmin
      .from('rfq_invitations')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('[Bid Submission] Failed to update invitation status:', updateError);
      // Don't fail submission if status update fails
    }

    // 5. TODO: Send confirmation email to bidder (optional)
    // 6. TODO: Notify RFQ creator about new bid submission

    console.log('[Bid Submission] Success:', {
      bidId: bid.id,
      invitationId: invitation.id,
      rfqId: invitation.rfq_id,
    });

    return NextResponse.json({
      success: true,
      bidId: bid.id,
      message: 'Quote submitted successfully',
    });

  } catch (error) {
    console.error('[Bid Submission] Exception:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while processing your submission',
      },
      { status: 500 }
    );
  }
}
