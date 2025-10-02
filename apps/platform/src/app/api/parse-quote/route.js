/**
 * API Endpoint: Parse Quote Document
 * Purpose: Extract quote data from uploaded PDF using Llama Parse + Claude
 * Method: POST
 * Body: { fileUrl: string, fileType: 'quote' | 'policy' }
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request) {
  try {
    // Initialize services (done at request time, not build time)
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const LLAMA_PARSE_API_KEY = process.env.LLAMA_PARSE_API_KEY;
    const LLAMA_PARSE_URL = 'https://api.cloud.llamaindex.ai/api/parsing/upload';

    const { fileUrl, fileType } = await request.json();

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'File URL is required' },
        { status: 400 }
      );
    }

    console.log('[Parse Quote] Starting extraction:', { fileUrl, fileType });

    // STEP 1: Download PDF
    console.log('[Parse Quote] Downloading PDF...');
    const pdfResponse = await fetch(fileUrl);

    if (!pdfResponse.ok) {
      console.error('[Parse Quote] Failed to download PDF:', pdfResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to download document' },
        { status: 500 }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log('[Parse Quote] PDF downloaded, size:', pdfBuffer.byteLength, 'bytes');

    // STEP 2: Parse PDF with Llama Parse
    console.log('[Parse Quote] Parsing with Llama Parse...');

    const formData = new FormData();
    formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), 'document.pdf');

    const parseResponse = await fetch(LLAMA_PARSE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLAMA_PARSE_API_KEY}`,
      },
      body: formData,
    });

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      console.error('[Parse Quote] Llama Parse failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to parse document' },
        { status: 500 }
      );
    }

    const parseResult = await parseResponse.json();
    console.log('[Parse Quote] Llama Parse complete');

    // Get the job ID and wait for completion
    const jobId = parseResult.id;
    let parsedText = '';

    // Poll for result (Llama Parse is asynchronous)
    const maxAttempts = 30;
    const pollInterval = 2000; // 2 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const resultResponse = await fetch(
        `https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`,
        {
          headers: {
            'Authorization': `Bearer ${LLAMA_PARSE_API_KEY}`,
          },
        }
      );

      if (resultResponse.ok) {
        const resultData = await resultResponse.json();
        parsedText = resultData.markdown || resultData.text || '';
        console.log('[Parse Quote] Parsed text length:', parsedText.length);
        break;
      }

      // Check status
      const statusResponse = await fetch(
        `https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}`,
        {
          headers: {
            'Authorization': `Bearer ${LLAMA_PARSE_API_KEY}`,
          },
        }
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (statusData.status === 'ERROR' || statusData.status === 'FAILED') {
          console.error('[Parse Quote] Job failed:', statusData);
          return NextResponse.json(
            { error: 'Document parsing failed' },
            { status: 500 }
          );
        }
      }
    }

    if (!parsedText) {
      console.error('[Parse Quote] No text extracted after polling');
      return NextResponse.json(
        { error: 'Failed to extract text from document' },
        { status: 500 }
      );
    }

    // STEP 3: Extract structured data using Claude
    console.log('[Parse Quote] Extracting structured data with Claude...');

    const extractionPrompt = fileType === 'quote'
      ? `You are analyzing an insurance quote document. Extract the following information in JSON format:

{
  "premium_amount": <number or null>,
  "coverage_amount": <number or null>,
  "deductible": <number or null>,
  "policy_term_months": <number or null>,
  "insurer_name": <string or null>,
  "policy_type": <string or null>,
  "key_coverages": [<array of strings>],
  "exclusions": [<array of strings>],
  "additional_benefits": [<array of strings>],
  "confidence": <number between 0 and 1>
}

Document text:
${parsedText}

Instructions:
- Extract exact numeric values for premium, coverage, and deductible
- Premium is usually labeled as "Premium", "Total Premium", "Annual Premium"
- Coverage is usually labeled as "Sum Insured", "Coverage Amount", "Limit"
- Deductible is labeled as "Deductible", "Excess"
- Policy term is in months (convert if given in years)
- Return null for any field you cannot find
- Provide a confidence score (0-1) for the extraction quality
- Return ONLY valid JSON, no markdown formatting`
      : `You are analyzing an insurance policy wording document. Extract the following information in JSON format:

{
  "policy_type": <string or null>,
  "key_coverages": [<array of strings>],
  "exclusions": [<array of strings>],
  "waiting_periods": [<array of strings>],
  "claim_procedure": <string or null>,
  "important_conditions": [<array of strings>],
  "red_flags": [<array of concerning terms or conditions>],
  "confidence": <number between 0 and 1>
}

Document text:
${parsedText}

Instructions:
- Extract all major coverages and exclusions
- Identify any concerning or unusual terms (red flags)
- Summarize the claims procedure if mentioned
- Return null for any field you cannot find
- Provide a confidence score (0-1) for the extraction quality
- Return ONLY valid JSON, no markdown formatting`;

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: extractionPrompt,
        },
      ],
    });

    const extractedText = claudeResponse.content[0].text;
    console.log('[Parse Quote] Claude response:', extractedText.substring(0, 200));

    // Parse JSON response (remove markdown if present)
    let extractedData;
    try {
      const jsonText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[Parse Quote] Failed to parse Claude JSON:', parseError);
      console.error('[Parse Quote] Claude response:', extractedText);
      // Return empty extraction instead of failing
      extractedData = {
        premium_amount: null,
        coverage_amount: null,
        deductible: null,
        policy_term_months: null,
        confidence: 0,
      };
    }

    console.log('[Parse Quote] Extraction complete:', {
      premium: extractedData.premium_amount,
      coverage: extractedData.coverage_amount,
      confidence: extractedData.confidence,
    });

    return NextResponse.json({
      success: true,
      extractedData,
      parsedText: parsedText.substring(0, 5000), // Return first 5000 chars for review
    });

  } catch (error) {
    console.error('[Parse Quote] Exception:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while parsing the document',
      },
      { status: 500 }
    );
  }
}
