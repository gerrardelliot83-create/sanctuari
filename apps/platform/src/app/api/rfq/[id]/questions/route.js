/**
 * API Route: GET /api/rfq/[id]/questions
 * Purpose: Load all questions for an RFQ's product, grouped by section
 * Returns: Questions array with metadata
 */

import { createClient } from '@sanctuari/database/lib/server';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const supabase = createClient();
    const rfqId = params.id;

    console.log('[Questions API] Loading questions for RFQ:', rfqId);

    // Get RFQ to find product_id
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select('product_id, user_id, title, status')
      .eq('id', rfqId)
      .single();

    if (rfqError || !rfq) {
      console.error('[Questions API] RFQ not found:', rfqError);
      return NextResponse.json(
        { error: 'RFQ not found', details: rfqError?.message },
        { status: 404 }
      );
    }

    console.log('[Questions API] RFQ found:', {
      id: rfqId,
      product_id: rfq.product_id,
      title: rfq.title,
      status: rfq.status
    });

    // Load all questions for this product
    const { data: questions, error: questionsError } = await supabase
      .from('rfq_questions')
      .select('*')
      .eq('product_id', rfq.product_id)
      .order('section', { ascending: true })
      .order('order_index', { ascending: true });

    if (questionsError) {
      console.error('[Questions API] Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch questions', details: questionsError.message },
        { status: 500 }
      );
    }

    console.log('[Questions API] Questions fetched:', {
      product_id: rfq.product_id,
      total_questions: questions?.length || 0,
      sections: questions ? [...new Set(questions.map(q => q.section))] : []
    });

    // Handle case where no questions found
    if (!questions || questions.length === 0) {
      console.warn('[Questions API] No questions found for product_id:', rfq.product_id);
      console.warn('[Questions API] This could mean:');
      console.warn('  1. No questions have been loaded for this product in the database');
      console.warn('  2. RLS policies are blocking the query');
      console.warn('  3. product_id mismatch between rfqs and rfq_questions tables');

      return NextResponse.json({
        sections: [],
        totalQuestions: 0,
        totalSections: 0,
        warning: 'No questions configured for this product',
        product_id: rfq.product_id,
      });
    }

    // Group questions by section
    const groupedQuestions = {};
    questions.forEach(question => {
      const section = question.section || 'General';
      if (!groupedQuestions[section]) {
        groupedQuestions[section] = [];
      }
      groupedQuestions[section].push(question);
    });

    // Convert to array of sections
    const sections = Object.keys(groupedQuestions).map((sectionName, index) => ({
      name: sectionName,
      index: index,
      questions: groupedQuestions[sectionName],
      questionCount: groupedQuestions[sectionName].length,
    }));

    console.log('[Questions API] Sections created:', sections.map(s => ({
      name: s.name,
      questionCount: s.questionCount,
      sampleFields: s.questions.slice(0, 3).map(q => q.field_name)
    })));

    console.log('[Questions API] Successfully returning:', {
      totalQuestions: questions.length,
      totalSections: sections.length,
      sectionNames: sections.map(s => s.name)
    });

    return NextResponse.json({
      sections,
      totalQuestions: questions.length,
      totalSections: sections.length,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
