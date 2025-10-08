/**
 * Risk Identification Agent
 * Purpose: Identify risks associated with each quote
 * Model: Claude Sonnet 4
 */

import { createSubAgent, parseAIResponse } from '../langchain-setup';

export async function identifyRisks(quotes, rfqData) {
  const agent = createSubAgent();

  const prompt = `You are a Risk Identification Agent for insurance quote evaluation.

RFQ Context:
Product: ${rfqData.product_name}
Company: ${rfqData.company_name}

Quotes to Analyze:
${JSON.stringify(quotes, null, 2)}

Your task is to identify risks associated with each quote:

1. **Underinsurance Risk**: Is coverage limit adequate for the exposure?
2. **Coverage Gaps**: What uncovered risks could lead to out-of-pocket losses?
3. **Insurer Stability**: Any concerns about insurer's financial strength or claims-paying ability?
4. **Claims Settlement**: Known issues with insurer's claims settlement process or ratio?
5. **Policy Term Risks**: Risks in policy terms (auto-renewal, cancellation, premium escalation)?
6. **Operational Risks**: Claims process complexity that could delay settlement?

For each quote, assign a risk_score (0-100 where LOWER is better):
- 0-30: Low Risk (excellent choice)
- 31-50: Medium Risk (acceptable with minor concerns)
- 51-70: High Risk (significant concerns)
- 71-100: Critical Risk (not recommended)

Return ONLY a valid JSON object in this exact format:
{
  "quotes": [
    {
      "quote_id": "uuid-here",
      "risk_score": 25,
      "risk_level": "Low/Medium/High/Critical",
      "identified_risks": [
        {
          "risk": "Specific risk identified",
          "severity": "Critical/High/Medium/Low",
          "mitigation": "How this risk could be mitigated"
        }
      ],
      "insurer_stability": "Strong/Stable/Concerns/Unknown"
    }
  ],
  "overall_risk_assessment": "2-3 sentence summary of risk profile across quotes, highlighting safest option"
}

Be conservative - flag potential risks even if uncertain.`;

  try {
    const response = await agent.invoke([
      { role: 'user', content: prompt }
    ]);

    return parseAIResponse(response);
  } catch (error) {
    console.error('[Risk Agent] Error:', error);
    return {
      error: error.message,
      quotes: quotes.map(q => ({
        quote_id: q.quote_id,
        risk_score: 50,
        risk_level: 'Unknown',
        identified_risks: [{
          risk: 'Risk assessment unavailable',
          severity: 'Unknown',
          mitigation: 'Manual review recommended'
        }],
        insurer_stability: 'Unknown'
      })),
      overall_risk_assessment: 'Risk assessment temporarily unavailable'
    };
  }
}
