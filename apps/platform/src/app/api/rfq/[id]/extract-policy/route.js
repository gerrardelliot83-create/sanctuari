/**
 * API Route: POST /api/rfq/[id]/extract-policy
 * Purpose: Extract data from policy PDF using Llama Parse + Claude
 * Body: { policyUrl: string }
 * Returns: { extractedData, totalFields, extractedFields }
 */

import { createClient } from '@sanctuari/database/lib/server';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Llama Parse configuration
const LLAMA_PARSE_API_KEY = process.env.LLAMA_PARSE_API_KEY;
const LLAMA_PARSE_URL = 'https://api.cloud.llamaindex.ai/api/parsing/upload';

export async function POST(request, { params }) {
  try {
    const supabase = createClient();
    const rfqId = params.id;
    const { policyUrl } = await request.json();

    if (!policyUrl) {
      return NextResponse.json(
        { error: 'Policy URL is required' },
        { status: 400 }
      );
    }

    console.log('[Extract Policy] Starting extraction for RFQ:', rfqId);
    console.log('[Extract Policy] Policy URL:', policyUrl);

    // STEP 1: Get all questions for this RFQ
    const { data: questionsData } = await supabase
      .from('rfqs')
      .select(`
        product_id,
        product:insurance_products(id, name)
      `)
      .eq('id', rfqId)
      .single();

    if (!questionsData) {
      return NextResponse.json(
        { error: 'RFQ not found' },
        { status: 404 }
      );
    }

    const { data: questions } = await supabase
      .from('rfq_questions')
      .select('*')
      .eq('product_id', questionsData.product_id)
      .order('section')
      .order('order_index');

    console.log('[Extract Policy] Loaded questions:', questions.length);

    // STEP 2: Download and parse PDF with Llama Parse
    console.log('[Extract Policy] Downloading PDF from UploadThing...');

    const pdfResponse = await fetch(policyUrl);
    const pdfBuffer = await pdfResponse.arrayBuffer();

    console.log('[Extract Policy] Parsing PDF with Llama Parse...');

    // Upload to Llama Parse
    const formData = new FormData();
    formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), 'policy.pdf');

    const parseResponse = await fetch(LLAMA_PARSE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLAMA_PARSE_API_KEY}`,
      },
      body: formData,
    });

    if (!parseResponse.ok) {
      throw new Error('Llama Parse failed: ' + await parseResponse.text());
    }

    const parseResult = await parseResponse.json();
    const jobId = parseResult.id;

    // Poll for completion (Llama Parse is async)
    let policyText = '';
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      const statusResponse = await fetch(
        `https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`,
        {
          headers: { 'Authorization': `Bearer ${LLAMA_PARSE_API_KEY}` },
        }
      );

      if (statusResponse.ok) {
        const result = await statusResponse.json();
        policyText = result.markdown;
        break;
      }

      attempts++;
    }

    if (!policyText) {
      throw new Error('PDF parsing timed out');
    }

    console.log('[Extract Policy] PDF parsed successfully. Text length:', policyText.length);

    // STEP 3: Use Claude to extract field values
    console.log('[Extract Policy] Extracting fields with Claude...');

    const prompt = `You are an expert at extracting insurance policy data. I will give you:
1. The text content of an insurance policy document
2. A list of questions/fields that need to be filled

Your task is to extract the answer for each question from the policy document.

POLICY DOCUMENT:
${policyText}

QUESTIONS TO EXTRACT:
${JSON.stringify(questions.map(q => ({
  id: q.id,
  field_name: q.field_name,
  question_text: q.question_text,
  field_type: q.field_type,
  options: q.options,
})), null, 2)}

INSTRUCTIONS:
- For each question, find the relevant information in the policy document
- Extract the exact value that answers the question
- For dates, use ISO format (YYYY-MM-DD)
- For numbers, extract just the number (no currency symbols)
- For select/multiselect fields, choose from the provided options
- If information is not found in the document, set value to null
- Be thorough - extract as many fields as possible

Return a JSON object with this structure:
{
  "extracted_fields": {
    "question_id_1": "extracted value",
    "question_id_2": "extracted value",
    ...
  }
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    // Parse Claude's response
    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Failed to parse Claude response');
    }

    const extractionResult = JSON.parse(jsonMatch[0]);
    const extractedFields = extractionResult.extracted_fields || {};

    console.log('[Extract Policy] Claude extracted fields:', Object.keys(extractedFields).length);

    // STEP 4: Save extracted data to rfq_responses table
    const responsesToInsert = [];

    for (const [questionId, value] of Object.entries(extractedFields)) {
      if (value !== null && value !== undefined && value !== '') {
        responsesToInsert.push({
          rfq_id: rfqId,
          question_id: questionId,
          response_value: String(value),
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (responsesToInsert.length > 0) {
      // Batch upsert all responses
      const { error: upsertError } = await supabase
        .from('rfq_responses')
        .upsert(responsesToInsert, {
          onConflict: 'rfq_id,question_id'
        });

      if (upsertError) {
        console.error('[Extract Policy] Error saving responses:', upsertError);
        throw upsertError;
      }

      console.log('[Extract Policy] Saved responses:', responsesToInsert.length);
    }

    // STEP 5: Return results
    return NextResponse.json({
      success: true,
      totalFields: questions.length,
      extractedFields: Object.keys(extractedFields).length,
      extractedData: extractedFields,
      coveragePercent: Math.round((Object.keys(extractedFields).length / questions.length) * 100),
    });

  } catch (error) {
    console.error('[Extract Policy] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract policy data' },
      { status: 500 }
    );
  }
}
