/**
 * API Route: GET /api/rfq/[id]
 * Purpose: Get RFQ details by ID
 * Returns: RFQ object with metadata
 */

import { createClient } from '@sanctuari/database/lib/server';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const supabase = createClient();
    const rfqId = params.id;

    console.log('[RFQ API] Fetching RFQ details:', rfqId);

    // Get RFQ with product details
    const { data: rfq, error } = await supabase
      .from('rfqs')
      .select(`
        *,
        product:insurance_products(id, name, category)
      `)
      .eq('id', rfqId)
      .single();

    if (error || !rfq) {
      console.error('[RFQ API] RFQ not found:', error);
      return NextResponse.json(
        { error: 'RFQ not found', details: error?.message },
        { status: 404 }
      );
    }

    console.log('[RFQ API] RFQ found:', {
      id: rfq.id,
      title: rfq.title,
      status: rfq.status,
      product: rfq.product?.name
    });

    return NextResponse.json({ rfq });

  } catch (error) {
    console.error('[RFQ API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
