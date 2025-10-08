/**
 * API Route: POST /api/rfq/create
 * Purpose: Create a new draft bid (request for quotes)
 * Body: { product_id, company_id, user_id }
 * Returns: Created bid with ID (stored in rfqs table)
 */

import { createClient } from '@sanctuari/database/lib/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { product_id, company_id, user_id, title } = body;

    // Validate required fields
    if (!product_id || !company_id || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get product details for title
    const { data: product } = await supabase
      .from('insurance_products')
      .select('name')
      .eq('id', product_id)
      .single();

    // Create bid with draft status
    const { data: rfq, error } = await supabase
      .from('rfqs')
      .insert({
        user_id,
        company_id,
        product_id,
        title: title || `${product?.name || 'Insurance'} Bid`,
        status: 'draft',
        is_first_rfq: false, // We'll check this properly later
        rfq_number: null, // Generated on publish (will use BID-YYYY-0001 format)
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating bid:', error);
      return NextResponse.json(
        { error: 'Failed to create bid' },
        { status: 500 }
      );
    }

    return NextResponse.json({ rfq });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
