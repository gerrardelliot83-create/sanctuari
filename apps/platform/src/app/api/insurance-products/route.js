/**
 * API Route: GET /api/insurance-products
 * Purpose: Fetch all insurance products for RFQ creation
 * Returns: Array of insurance products
 */

import { createClient } from '@sanctuari/database/lib/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = createClient();

    // Get category filter from query params
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = supabase
      .from('insurance_products')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    // Apply category filter if provided
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching insurance products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch insurance products' },
        { status: 500 }
      );
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
