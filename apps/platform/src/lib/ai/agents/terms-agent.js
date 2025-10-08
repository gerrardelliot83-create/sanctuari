/**
 * Terms & Conditions Analysis Agent
 * Purpose: Analyze policy terms, exclusions, and favorability
 * Model: Claude Sonnet 4
 */

import { createSubAgent, parseAIResponse } from '../langchain-setup';

export async function analyzeTerms(quotes) {
  const agent = createSubAgent();

  const prompt = `You are a Terms & Conditions Analysis Agent for insurance policies.

Quotes with Policy Details:
${JSON.stringify(quotes, null, 2)}

Your task is to analyze policy terms and conditions:

1. **Policy Exclusions**: What risks are explicitly excluded? How material are these exclusions?
2. **Claims Process**: How complex is the claims filing and settlement process?
3. **Notice Periods**: What are the requirements for reporting claims/incidents?
4. **Documentation Requirements**: What documentation is needed for claims?
5. **Renewal & Cancellation**: What are the terms for policy renewal and cancellation?
6. **Dispute Resolution**: How are disputes handled? Arbitration vs. litigation?
7. **Overall Favorability**: Are terms more favorable to insured or insurer?

For each quote, assign a terms_score (0-100) based on:
- Minimal exclusions (30 points)
- Simple claims process (30 points)
- Favorable renewal/cancellation terms (20 points)
- Fair dispute resolution (20 points)

Return ONLY a valid JSON object in this exact format:
{
  "quotes": [
    {
      "quote_id": "uuid-here",
      "terms_score": 75,
      "favorability": "Client-Friendly/Balanced/Insurer-Favorable",
      "key_exclusions": ["List of material exclusions from coverage"],
      "claims_complexity": "Simple/Moderate/Complex",
      "red_flags": ["Terms that are particularly unfavorable or concerning"],
      "positive_terms": ["Terms that are particularly favorable to client"]
    }
  ],
  "comparative_summary": "2-3 sentence comparison highlighting which quote has most favorable terms"
}

Focus on material terms that affect coverage and claims experience.`;

  try {
    const response = await agent.invoke([
      { role: 'user', content: prompt }
    ]);

    return parseAIResponse(response);
  } catch (error) {
    console.error('[Terms Agent] Error:', error);
    return {
      error: error.message,
      quotes: quotes.map(q => ({
        quote_id: q.quote_id,
        terms_score: 50,
        favorability: 'Unable to analyze',
        key_exclusions: [],
        claims_complexity: 'Unknown',
        red_flags: ['Analysis failed'],
        positive_terms: []
      })),
      comparative_summary: 'Terms analysis temporarily unavailable'
    };
  }
}
