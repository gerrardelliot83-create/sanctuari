/**
 * Compliance Verification Agent
 * Purpose: Verify regulatory and statutory compliance
 * Model: Claude Sonnet 4
 */

import { createSubAgent, parseAIResponse } from '../langchain-setup';

export async function verifyCompliance(quotes, rfqData, insuranceProduct) {
  const agent = createSubAgent();

  const prompt = `You are a Compliance Verification Agent for Indian insurance regulations.

Insurance Product: ${insuranceProduct}
Category: ${rfqData.product_category}
Context: ${rfqData.company_name}

Quotes to Verify:
${JSON.stringify(quotes, null, 2)}

Your task is to verify compliance with:

1. **IRDAI Regulations**: Does coverage meet Insurance Regulatory and Development Authority of India requirements?
2. **Mandatory Coverages**: Are all legally required coverages included? (e.g., for Workmen's Compensation, statutory minimums must be met)
3. **Statutory Requirements**: Compliance with relevant acts:
   - Workmen's Compensation Act, 1923
   - Motor Vehicles Act (if applicable)
   - Other industry-specific regulations
4. **Industry Standards**: Does coverage meet industry best practices?
5. **Documentation**: Are required regulatory documents included (IRDAI approval, terms & conditions)?

For each quote, assign a compliance_score (0-100) based on:
- Regulatory compliance (40 points)
- Statutory requirements met (40 points)
- Documentation completeness (20 points)

Return ONLY a valid JSON object in this exact format:
{
  "quotes": [
    {
      "quote_id": "uuid-here",
      "compliance_score": 90,
      "regulatory_status": "Compliant/Non-Compliant/Needs Verification",
      "mandatory_coverages_met": true,
      "missing_requirements": ["List specific missing mandatory coverages or requirements"],
      "compliance_risks": ["List potential compliance issues or gaps"]
    }
  ],
  "overall_assessment": "2-3 sentence assessment of compliance status across quotes"
}

Be specific about any compliance gaps that could expose the client to legal/regulatory risk.`;

  try {
    const response = await agent.invoke([
      { role: 'user', content: prompt }
    ]);

    return parseAIResponse(response);
  } catch (error) {
    console.error('[Compliance Agent] Error:', error);
    return {
      error: error.message,
      quotes: quotes.map(q => ({
        quote_id: q.quote_id,
        compliance_score: 50,
        regulatory_status: 'Unable to verify',
        mandatory_coverages_met: null,
        missing_requirements: ['Verification failed'],
        compliance_risks: []
      })),
      overall_assessment: 'Compliance verification temporarily unavailable'
    };
  }
}
