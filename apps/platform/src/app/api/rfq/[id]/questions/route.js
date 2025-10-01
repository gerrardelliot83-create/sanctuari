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
      console.error('[Questions API] ❌ NO QUESTIONS FOUND');
      console.error('[Questions API] RFQ Details:', {
        rfq_id: rfqId,
        product_id: rfq.product_id,
        title: rfq.title
      });

      // Try to find product details
      const { data: product } = await supabase
        .from('insurance_products')
        .select('id, name')
        .eq('id', rfq.product_id)
        .single();

      console.error('[Questions API] Product lookup:', product || 'NOT FOUND');

      // Check if ANY questions exist for this product (bypass potential RLS issues)
      const { count: totalQuestionsCount } = await supabase
        .from('rfq_questions')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', rfq.product_id);

      console.error('[Questions API] Total questions in DB for this product:', totalQuestionsCount);

      console.error('[Questions API] Possible causes:');
      console.error('  1. No questions loaded for this product yet');
      console.error('  2. product_id mismatch between tables');
      console.error('  3. Questions exist but RLS policy blocking (unlikely with public read)');

      return NextResponse.json({
        sections: [],
        totalQuestions: 0,
        totalSections: 0,
        warning: 'No questions configured for this product',
        product_id: rfq.product_id,
        product_name: product?.name || 'Unknown',
        debug: {
          questionsInDB: totalQuestionsCount || 0,
        }
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

    // Define section order priority (lower number = earlier in form)
    // Based on actual CSV section names from the database
    const sectionPriority = {
      // Primary Information (1-10)
      'Proposer Information': 1,
      'Insured Details': 2,
      'Proposer Details': 3,
      'Basic Information': 4,

      // Business & Company Details (11-20)
      'Business Details': 11,
      'Company Details': 12,
      'Organization Information': 13,

      // Coverage & Risk (21-40)
      'Coverage Requirements': 21,
      'Coverage and Add-ons': 22,
      'Risk Information': 23,
      'Risk Details': 24,
      'Insurance History and Risk Details': 25,
      'Policy Details': 26,

      // Product & Sales (41-50)
      'Product Information': 41,
      'Product and Sales Information': 42,
      'Service Details': 43,

      // Financial (51-60)
      'Financial Information': 51,
      'Premium Details': 52,

      // Claims & History (61-70)
      'Claims History': 61,
      'Insurance History': 62,
      'Loss History': 63,

      // Annexures & Supporting Docs (71-85)
      'Supporting Documents': 71,
      'Annexure A - Manufacturing Units': 81,
      'Annexure B - Warehouses etc.': 82,
      'Annexure C - Product Information': 83,

      // Disclosure & Others (86-98)
      'Disclosure': 86,
      'Others': 90,
      'Other Details': 91,
      'Additional Information': 92,

      // Additional Requirements - MUST BE LAST (99)
      'Additional Requirements': 99,

      // Default
      'General': 50,
    };

    // Get priority for a section name
    const getSectionPriority = (sectionName) => {
      // Exact match first
      if (sectionPriority[sectionName] !== undefined) {
        return sectionPriority[sectionName];
      }

      // Pattern matching for flexibility
      const nameLower = sectionName.toLowerCase();

      // Always put "Additional Requirements" or "Others" last
      if (nameLower.includes('additional') || nameLower.includes('other')) {
        return 95;
      }

      // Annexures towards the end
      if (nameLower.includes('annexure') || nameLower.includes('annex')) {
        return 80;
      }

      // Disclosure/Legal towards end
      if (nameLower.includes('disclosure') || nameLower.includes('declaration')) {
        return 85;
      }

      // Proposer/Insured at beginning
      if (nameLower.includes('proposer') || nameLower.includes('insured')) {
        return 5;
      }

      // Business/Company early
      if (nameLower.includes('business') || nameLower.includes('company')) {
        return 15;
      }

      // Coverage/Risk in middle
      if (nameLower.includes('coverage') || nameLower.includes('risk')) {
        return 25;
      }

      // Claims/History later
      if (nameLower.includes('claim') || nameLower.includes('history')) {
        return 65;
      }

      // Default to middle
      return 50;
    };

    // Convert to array of sections and sort by priority
    const sections = Object.keys(groupedQuestions)
      .sort((a, b) => getSectionPriority(a) - getSectionPriority(b))
      .map((sectionName, index) => ({
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
