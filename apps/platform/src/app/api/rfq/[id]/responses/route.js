/**
 * API Routes: /api/rfq/[id]/responses
 * GET: Load saved responses for an RFQ
 * PATCH: Save/update responses (auto-save)
 */

import { createClient } from '@sanctuari/database/lib/server';
import { NextResponse } from 'next/server';

// GET - Load saved responses
export async function GET(request, { params }) {
  try {
    const supabase = createClient();
    const rfqId = params.id;

    const { data: responses, error } = await supabase
      .from('rfq_responses')
      .select('*')
      .eq('rfq_id', rfqId);

    if (error) {
      console.error('Error fetching responses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }

    // Convert to object keyed by question_id for easy lookup
    const responsesMap = {};
    responses.forEach(response => {
      responsesMap[response.question_id] = {
        value: response.response_value,
        fileUrl: response.response_file_url,
        updatedAt: response.updated_at,
      };
    });

    return NextResponse.json({ responses: responsesMap });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Save/update responses (auto-save)
export async function PATCH(request, { params }) {
  try {
    const supabase = createClient();
    const rfqId = params.id;
    const body = await request.json();

    const { questionId, value, fileUrl } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: 'Missing question_id' },
        { status: 400 }
      );
    }

    // Upsert response (insert or update)
    const { data, error } = await supabase
      .from('rfq_responses')
      .upsert({
        rfq_id: rfqId,
        question_id: questionId,
        response_value: value || null,
        response_file_url: fileUrl || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'rfq_id,question_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving response:', error);
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      );
    }

    // Update RFQ updated_at timestamp
    await supabase
      .from('rfqs')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', rfqId);

    return NextResponse.json({ success: true, response: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
