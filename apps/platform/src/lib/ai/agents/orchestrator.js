/**
 * Orchestrator Agent
 * Purpose: Coordinate all sub-agents and synthesize final recommendations
 * Model: Claude Opus 4.1
 */

import { createOrchestrator, parseAIResponse, formatQuotesForAI, formatRFQForAI } from '../langchain-setup';
import { analyzeCoverage } from './coverage-agent';
import { analyzePricing } from './pricing-agent';
import { analyzeTerms } from './terms-agent';
import { verifyCompliance } from './compliance-agent';
import { identifyRisks } from './risk-agent';

/**
 * Main orchestration function
 * Coordinates all AI agents and synthesizes results
 */
export async function orchestrateAnalysis(quotes, rfqData, insuranceProduct) {
  console.log('[Orchestrator] Starting multi-agent analysis...');

  // Format data for AI consumption
  const formattedQuotes = formatQuotesForAI(quotes);
  const formattedRFQ = formatRFQForAI(rfqData);

  // Run all agents in parallel for efficiency
  console.log('[Orchestrator] Running sub-agents in parallel...');
  const [
    coverageAnalysis,
    pricingAnalysis,
    termsAnalysis,
    complianceAnalysis,
    riskAnalysis
  ] = await Promise.all([
    analyzeCoverage(formattedQuotes, formattedRFQ),
    analyzePricing(formattedQuotes, formattedRFQ, insuranceProduct),
    analyzeTerms(formattedQuotes),
    verifyCompliance(formattedQuotes, formattedRFQ, insuranceProduct),
    identifyRisks(formattedQuotes, formattedRFQ)
  ]);

  console.log('[Orchestrator] Sub-agent analyses complete. Synthesizing...');

  // Orchestrator synthesizes all agent outputs
  const orchestrator = createOrchestrator();

  const synthesisPrompt = `You are the Master Insurance Analysis Orchestrator for Sanctuari platform.

You have received detailed analyses from 5 specialized AI agents. Your job is to synthesize these into a clear, actionable recommendation for the client.

**Sub-Agent Analyses:**

1. COVERAGE ANALYSIS:
${JSON.stringify(coverageAnalysis, null, 2)}

2. PRICING ANALYSIS:
${JSON.stringify(pricingAnalysis, null, 2)}

3. TERMS & CONDITIONS ANALYSIS:
${JSON.stringify(termsAnalysis, null, 2)}

4. COMPLIANCE ANALYSIS:
${JSON.stringify(complianceAnalysis, null, 2)}

5. RISK ANALYSIS:
${JSON.stringify(riskAnalysis, null, 2)}

**RFQ Context:**
Product: ${insuranceProduct}
Company: ${formattedRFQ.company_name}
RFQ Number: ${formattedRFQ.rfq_number}

**Your Task:**

Synthesize all analyses and provide:
1. Overall quote rankings with composite scores (0-100)
2. Executive summary in plain, non-technical language for business owners
3. Clear recommendation on which quote to select and why
4. Key decision factors the client should consider
5. Confidence level in your recommendation

**Scoring Methodology:**
- Coverage: 30%
- Pricing: 25%
- Terms: 20%
- Compliance: 15%
- Risk: 10% (inverted - lower risk_score = higher contribution)

Calculate overall_score as:
(coverage_score × 0.30) + (pricing_score × 0.25) + (terms_score × 0.20) + (compliance_score × 0.15) + ((100 - risk_score) × 0.10)

**Recommendation Labels:**
- 90-100: "Highly Recommended"
- 75-89: "Recommended"
- 60-74: "Consider"
- Below 60: "Not Recommended"

Return ONLY a valid JSON object in this exact format:
{
  "ranked_quotes": [
    {
      "quote_id": "uuid-here",
      "overall_score": 85,
      "rank": 1,
      "insurer_name": "Insurer Name",
      "premium": 50000,
      "recommendation_label": "Highly Recommended/Recommended/Consider/Not Recommended",
      "strengths": ["Top 3-4 strengths of this quote in plain language"],
      "weaknesses": ["Top 2-3 weaknesses or concerns"],
      "best_for": "One sentence: What type of client or situation this quote is best suited for"
    }
  ],
  "executive_summary": "3-4 sentence plain language summary that a non-technical business owner can understand. Explain what you analyzed, key findings, and bottom-line recommendation.",
  "top_recommendation": {
    "quote_id": "uuid-of-top-quote",
    "reason": "2-3 sentence explanation of why this is the best choice, in simple business terms",
    "confidence": 85
  },
  "key_decision_factors": [
    "3-5 key factors the client should consider when making final decision"
  ],
  "important_notes": [
    "Any critical warnings, next steps, or clarifications needed"
  ]
}

Use plain, professional language. Avoid insurance jargon. Write like you're advising a business owner, not an insurance expert.`;

  try {
    const response = await orchestrator.invoke([
      { role: 'user', content: synthesisPrompt }
    ]);

    const synthesis = parseAIResponse(response);

    console.log('[Orchestrator] Synthesis complete');

    return {
      coverageAnalysis,
      pricingAnalysis,
      termsAnalysis,
      complianceAnalysis,
      riskAnalysis,
      orchestratorSynthesis: synthesis
    };

  } catch (error) {
    console.error('[Orchestrator] Synthesis error:', error);

    // Return fallback synthesis
    return {
      coverageAnalysis,
      pricingAnalysis,
      termsAnalysis,
      complianceAnalysis,
      riskAnalysis,
      orchestratorSynthesis: createFallbackSynthesis(formattedQuotes)
    };
  }
}

/**
 * Create fallback synthesis if orchestrator fails
 */
function createFallbackSynthesis(quotes) {
  return {
    ranked_quotes: quotes.map((quote, index) => ({
      quote_id: quote.quote_id,
      overall_score: 50,
      rank: index + 1,
      insurer_name: quote.insurer_name,
      premium: quote.premium_amount,
      recommendation_label: 'Consider',
      strengths: ['Manual review recommended'],
      weaknesses: ['AI analysis temporarily unavailable'],
      best_for: 'Requires manual evaluation'
    })),
    executive_summary: 'AI analysis is temporarily unavailable. Please review quotes manually or try again later.',
    top_recommendation: {
      quote_id: quotes[0]?.quote_id,
      reason: 'AI analysis unavailable - manual review required',
      confidence: 0
    },
    key_decision_factors: [
      'Compare premium amounts',
      'Review coverage limits',
      'Check policy terms and exclusions',
      'Verify insurer credentials'
    ],
    important_notes: [
      'AI analysis system is temporarily unavailable',
      'Please conduct manual review of all quotes',
      'Contact support if issue persists'
    ]
  };
}
