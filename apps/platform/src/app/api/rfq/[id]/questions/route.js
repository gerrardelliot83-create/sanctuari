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

    // Get RFQ to find product_id
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select('product_id, user_id')
      .eq('id', rfqId)
      .single();

    if (rfqError || !rfq) {
      return NextResponse.json(
        { error: 'RFQ not found' },
        { status: 404 }
      );
    }

    // Load all questions for this product
    const { data: questions, error: questionsError } = await supabase
      .from('rfq_questions')
      .select('*')
      .eq('product_id', rfq.product_id)
      .order('section', { ascending: true })
      .order('order_index', { ascending: true });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    // Handle case where no questions found
    if (!questions || questions.length === 0) {
      return NextResponse.json({
        sections: [],
        totalQuestions: 0,
        totalSections: 0,
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
