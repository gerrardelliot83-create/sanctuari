/**
 * Coverage Analysis Agent
 * Purpose: Analyze insurance quote coverage completeness and gaps
 * Model: Claude Sonnet 4
 */

import { createSubAgent, parseAIResponse } from '../langchain-setup';

export async function analyzeCoverage(quotes, rfqData) {
  const agent = createSubAgent();

  const prompt = `You are a Coverage Analysis Agent for insurance quotes in India.

RFQ Requirements:
Product: ${rfqData.product_name}
Category: ${rfqData.product_category}
Company: ${rfqData.company_name}

Quotes Submitted:
${JSON.stringify(quotes, null, 2)}

Your task is to analyze each quote's coverage comprehensively:

1. **Coverage Completeness**: Does the quote cover all essential risks for this insurance product?
2. **Coverage Gaps**: What important coverages are missing or have inadequate limits?
3. **Add-on Coverages**: What additional coverages are included beyond the base policy?
4. **Sub-limits**: Are sub-limits adequate or restrictive?
5. **Territory/Jurisdiction**: Does coverage extend to required geographical areas?
6. **Exclusions**: Are there any concerning exclusions that limit coverage?

For each quote, assign a coverage_score (0-100) based on:
- Comprehensiveness of coverage (40 points)
- Adequacy of limits (30 points)
- Breadth of add-ons (20 points)
- Minimal exclusions (10 points)

Return ONLY a valid JSON object in this exact format:
{
  "quotes": [
    {
      "quote_id": "uuid-here",
      "coverage_score": 85,
      "completeness": "Comprehensive/Adequate/Limited/Inadequate",
      "gaps": ["List of specific coverage gaps or inadequate limits"],
      "strengths": ["List of coverage strengths"],
      "red_flags": ["Critical concerns about coverage limitations"],
      "add_ons_included": ["List of additional coverages beyond base policy"],
      "exclusions_concern": ["Concerning exclusions that materially limit coverage"]
    }
  ],
  "comparative_analysis": "Brief 2-3 sentence comparison of coverage across all quotes highlighting which offers most comprehensive protection"
}

Be specific and actionable. Focus on material differences that affect risk protection.`;

  try {
    console.log('[Coverage Agent] Analyzing coverage for', quotes.length, 'quotes...');
    const response = await agent.invoke([
      { role: 'user', content: prompt }
    ]);

    console.log('[Coverage Agent] Response received, parsing...');
    const parsed = parseAIResponse(response);

    // Check for parsing errors
    if (parsed.error) {
      console.error('[Coverage Agent] Parsing failed:', parsed.errorMessage);
      throw new Error(`Parsing failed: ${parsed.errorMessage}`);
    }

    // Validate response structure
    if (!parsed.quotes || !Array.isArray(parsed.quotes)) {
      console.error('[Coverage Agent] Invalid response structure - missing quotes array');
      throw new Error('Invalid response structure');
    }

    console.log('[Coverage Agent] Analysis complete -', parsed.quotes.length, 'quotes analyzed');
    return parsed;

  } catch (error) {
    console.error('[Coverage Agent] Error:', {
      message: error.message,
      stack: error.stack?.substring(0, 500)
    });

    return {
      error: error.message,
      quotes: quotes.map(q => ({
        quote_id: q.quote_id,
        coverage_score: 50,
        completeness: 'Unable to analyze',
        gaps: ['Analysis failed: ' + error.message],
        strengths: [],
        red_flags: [],
        add_ons_included: [],
        exclusions_concern: []
      })),
      comparative_analysis: 'Coverage analysis temporarily unavailable'
    };
  }
}
