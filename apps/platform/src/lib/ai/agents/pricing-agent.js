/**
 * Pricing Comparison Agent
 * Purpose: Analyze quote pricing competitiveness and value for money
 * Model: Claude Sonnet 4
 */

import { createSubAgent, parseAIResponse } from '../langchain-setup';

export async function analyzePricing(quotes, rfqData, insuranceProduct) {
  const agent = createSubAgent();

  const prompt = `You are a Pricing Analysis Agent for Indian insurance market.

Insurance Product: ${insuranceProduct}
Category: ${rfqData.product_category}
RFQ Context: ${rfqData.company_name} seeking coverage

Quotes Submitted:
${JSON.stringify(quotes, null, 2)}

Your task is to analyze pricing competitiveness and value:

1. **Premium Competitiveness**: Compare premiums relative to each other and typical market rates
2. **Value for Money**: Assess premium relative to coverage limits (premium efficiency)
3. **Deductible Impact**: How do deductibles affect overall value?
4. **Add-on Pricing**: Are additional coverages reasonably priced?
5. **Hidden Costs**: Any loading factors, fees, or exclusions that affect true cost?

For each quote, assign a pricing_score (0-100) based on:
- Absolute premium competitiveness (40 points)
- Value for money / premium efficiency (40 points)
- Transparency / no hidden costs (20 points)

Calculate premium_efficiency as: (Premium / Coverage Amount) × 100,000
This shows premium per ₹1 lakh of coverage.

Return ONLY a valid JSON object in this exact format:
{
  "quotes": [
    {
      "quote_id": "uuid-here",
      "pricing_score": 85,
      "value_rating": "Excellent/Good/Fair/Poor",
      "premium_efficiency": 0.XX,
      "competitive_position": "Most Competitive/Competitive/Average/Expensive",
      "value_highlights": ["Specific reasons this offers good value"],
      "pricing_concerns": ["Specific concerns about pricing or hidden costs"]
    }
  ],
  "best_value": "quote_id of best value quote",
  "market_insights": "2-3 sentence analysis of pricing spread and what's driving differences"
}

Be specific about why one quote offers better value than another.`;

  try {
    console.log('[Pricing Agent] Analyzing pricing for', quotes.length, 'quotes...');
    const response = await agent.invoke([
      { role: 'user', content: prompt }
    ]);

    console.log('[Pricing Agent] Response received, parsing...');
    const parsed = parseAIResponse(response);

    if (parsed.error) {
      throw new Error(`Parsing failed: ${parsed.errorMessage}`);
    }

    if (!parsed.quotes || !Array.isArray(parsed.quotes)) {
      throw new Error('Invalid response structure');
    }

    console.log('[Pricing Agent] Analysis complete');
    return parsed;
  } catch (error) {
    console.error('[Pricing Agent] Error:', {
      message: error.message,
      stack: error.stack?.substring(0, 500)
    });
    return {
      error: error.message,
      quotes: quotes.map(q => ({
        quote_id: q.quote_id,
        pricing_score: 50,
        value_rating: 'Unable to analyze',
        premium_efficiency: q.coverage_amount ? (q.premium_amount / q.coverage_amount) * 100000 : null,
        competitive_position: 'Unknown',
        value_highlights: [],
        pricing_concerns: ['Analysis failed: ' + error.message]
      })),
      best_value: null,
      market_insights: 'Pricing analysis temporarily unavailable'
    };
  }
}
