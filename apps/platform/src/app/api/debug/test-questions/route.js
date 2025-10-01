/**
 * DEBUG API Route: GET /api/debug/test-questions
 * Purpose: Diagnose questions loading issue
 * Tests:
 * 1. Count total questions in rfq_questions table
 * 2. List all insurance products
 * 3. Sample questions for first product
 * 4. Check RFQ -> product_id associations
 */

import { createClient } from '@sanctuari/database/lib/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = createClient();
    const diagnostics = {};

    // 1. Count total questions
    const { count: totalQuestions, error: countError } = await supabase
      .from('rfq_questions')
      .select('*', { count: 'exact', head: true });

    diagnostics.totalQuestionsInDB = totalQuestions;
    if (countError) {
      diagnostics.countError = countError.message;
    }

    // 2. List all insurance products
    const { data: products, error: productsError } = await supabase
      .from('insurance_products')
      .select('id, name, category, is_active')
      .order('name');

    diagnostics.totalProducts = products?.length || 0;
    diagnostics.products = products || [];
    if (productsError) {
      diagnostics.productsError = productsError.message;
    }

    // 3. Get questions grouped by product
    const { data: allQuestions, error: allQuestionsError } = await supabase
      .from('rfq_questions')
      .select('product_id, section, question_text, field_type, field_name, order_index, metadata');

    if (allQuestionsError) {
      diagnostics.allQuestionsError = allQuestionsError.message;
    } else {
      // Group questions by product_id
      const questionsByProduct = {};
      allQuestions.forEach(q => {
        if (!questionsByProduct[q.product_id]) {
          questionsByProduct[q.product_id] = [];
        }
        questionsByProduct[q.product_id].push(q);
      });

      diagnostics.questionsByProduct = Object.keys(questionsByProduct).map(productId => ({
        product_id: productId,
        count: questionsByProduct[productId].length,
        sections: [...new Set(questionsByProduct[productId].map(q => q.section))],
        sampleQuestions: questionsByProduct[productId].slice(0, 3).map(q => ({
          field_name: q.field_name,
          question_text: q.question_text,
          section: q.section,
          order_index: q.order_index,
        }))
      }));
    }

    // 4. Check existing RFQs and their product associations
    const { data: rfqs, error: rfqsError } = await supabase
      .from('rfqs')
      .select('id, product_id, title, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    diagnostics.recentRFQs = rfqs || [];
    if (rfqsError) {
      diagnostics.rfqsError = rfqsError.message;
    }

    // 5. Test a specific query like the wizard does
    if (rfqs && rfqs.length > 0) {
      const testRfq = rfqs[0];
      const { data: testQuestions, error: testError } = await supabase
        .from('rfq_questions')
        .select('*')
        .eq('product_id', testRfq.product_id)
        .order('section', { ascending: true })
        .order('order_index', { ascending: true });

      diagnostics.testQuery = {
        rfq_id: testRfq.id,
        product_id: testRfq.product_id,
        questionsFound: testQuestions?.length || 0,
        error: testError?.message || null,
        sampleQuestions: testQuestions?.slice(0, 5).map(q => ({
          section: q.section,
          field_name: q.field_name,
          question_text: q.question_text.substring(0, 80),
        })) || []
      };
    }

    // 6. Check RLS policies
    diagnostics.rlsInfo = {
      note: 'RFQ questions should have public read access (policy: RFQ questions public read)',
      policy: 'FOR SELECT USING (true)',
      reminder: 'If no questions found, check if RLS policy exists and is enabled'
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      diagnostics
    }, { status: 200 });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
