/**
 * API: Network Members
 * GET /api/network/members
 * Purpose: Fetch network members (insurers/brokers) with filtering
 */

import { NextResponse } from 'next/server';
import { createClient } from '@sanctuari/database/lib/server';

export async function GET(request) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'insurer' | 'broker' | null (all)
    const category = searchParams.get('category'); // 'general' | 'health' | 'life' | 'marine' | 'cyber' | null (all)
    const search = searchParams.get('search'); // Company name search

    // Build query
    let query = supabase
      .from('network_members')
      .select('*')
      .eq('is_active', true)
      .order('company_name', { ascending: true });

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search && search.trim()) {
      query = query.ilike('company_name', `%${search.trim()}%`);
    }

    // Execute query
    const { data: members, error: fetchError } = await query;

    if (fetchError) {
      console.error('[Network Members API] Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch network members' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      members: members || [],
      count: members?.length || 0
    });

  } catch (error) {
    console.error('[Network Members API] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
