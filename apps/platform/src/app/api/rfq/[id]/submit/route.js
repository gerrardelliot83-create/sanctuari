/**
 * API Route: POST /api/rfq/[id]/submit
 * Purpose: Submit RFQ - generate number and publish
 * Returns: Updated RFQ with rfq_number and status='published'
 */

import { createClient } from '@sanctuari/database/lib/server';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const supabase = createClient();
    const rfqId = params.id;

    console.log('[Submit API] Submitting RFQ:', rfqId);

    // Get current RFQ
    const { data: rfq, error: fetchError } = await supabase
      .from('rfqs')
      .select('*')
      .eq('id', rfqId)
      .single();

    if (fetchError || !rfq) {
      console.error('[Submit API] RFQ not found:', fetchError);
      return NextResponse.json(
        { error: 'RFQ not found' },
        { status: 404 }
      );
    }

    // Check if already submitted
    if (rfq.status === 'published') {
      console.log('[Submit API] RFQ already published:', rfq.rfq_number);
      return NextResponse.json({ rfq });
    }

    // Generate RFQ number
    const rfqNumber = await generateRFQNumber(supabase);

    console.log('[Submit API] Generated RFQ number:', rfqNumber);

    // Update RFQ to published status
    const { data: updatedRfq, error: updateError } = await supabase
      .from('rfqs')
      .update({
        rfq_number: rfqNumber,
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', rfqId)
      .select()
      .single();

    if (updateError) {
      console.error('[Submit API] Error updating RFQ:', updateError);
      return NextResponse.json(
        { error: 'Failed to submit RFQ', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('[Submit API] RFQ submitted successfully:', {
      id: updatedRfq.id,
      rfq_number: updatedRfq.rfq_number,
      status: updatedRfq.status
    });

    return NextResponse.json({ rfq: updatedRfq });

  } catch (error) {
    console.error('[Submit API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate a unique RFQ number
 * Format: RFQ-YYYY-XXXXXX
 * Example: RFQ-2025-000001
 */
async function generateRFQNumber(supabase) {
  const year = new Date().getFullYear();
  const prefix = `RFQ-${year}-`;

  // Get the latest RFQ number for this year
  const { data: latestRfq } = await supabase
    .from('rfqs')
    .select('rfq_number')
    .like('rfq_number', `${prefix}%`)
    .order('rfq_number', { ascending: false })
    .limit(1)
    .single();

  let nextNumber = 1;

  if (latestRfq && latestRfq.rfq_number) {
    // Extract the number part and increment
    const parts = latestRfq.rfq_number.split('-');
    const lastNumber = parseInt(parts[2], 10);
    nextNumber = lastNumber + 1;
  }

  // Pad with zeros (6 digits)
  const paddedNumber = String(nextNumber).padStart(6, '0');

  return `${prefix}${paddedNumber}`;
}
