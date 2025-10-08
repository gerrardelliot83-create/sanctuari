# SANCTUARI AI ANALYSIS SYSTEM - COMPLETE DOCUMENTATION

**Version:** 1.0
**Last Updated:** October 8, 2025
**Status:** Production Ready

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Analysis Flow](#analysis-flow)
4. [AI Agents](#ai-agents)
5. [Data Requirements](#data-requirements)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [Scoring Methodology](#scoring-methodology)
9. [Error Handling](#error-handling)
10. [Performance](#performance)
11. [Cost Analysis](#cost-analysis)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 SYSTEM OVERVIEW

The Sanctuari AI Analysis System uses a **multi-agent architecture** powered by Claude AI to provide intelligent, unbiased insurance quote evaluation.

### **Core Purpose:**
Transform complex insurance quotes into **plain-language, actionable recommendations** for business owners who are not insurance experts.

### **Key Features:**
- ✅ **5 Specialized AI Agents** - Each focuses on one aspect (coverage, pricing, terms, compliance, risk)
- ✅ **1 Orchestrator Agent** - Synthesizes all analyses into final recommendation
- ✅ **Parallel Execution** - All 5 agents run simultaneously (20-30s total)
- ✅ **Composite Scoring** - Weighted algorithm combines all factors
- ✅ **Cached Results** - Analysis stored in database for instant retrieval
- ✅ **Graceful Degradation** - Partial results if some agents fail

---

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────────────────┐
│              USER INTERFACE                         │
│  (Click "Analyze with AI" in Quotes Tab)           │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│         API ENDPOINT                                │
│  POST /api/rfq/[id]/analyze-quotes                  │
│  - Load RFQ + Bids from database                    │
│  - Validate bid data quality                        │
│  - Call orchestrateAnalysis()                       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│      ORCHESTRATOR AGENT                             │
│  (Claude Opus 4.1 - High-level synthesis)           │
│  - Launches 5 sub-agents in parallel                │
│  - Collects all results                             │
│  - Synthesizes final recommendation                 │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │  PARALLEL EXECUTION │
        └──────────┬──────────┘
                   │
    ┌──────┬───────┼───────┬──────┐
    ▼      ▼       ▼       ▼      ▼
┌────────────────────────────────────────┐
│  SUB-AGENTS (Claude Sonnet 4)          │
├────────────────────────────────────────┤
│ 1. Coverage Agent    - 30% weight      │
│ 2. Pricing Agent     - 25% weight      │
│ 3. Terms Agent       - 20% weight      │
│ 4. Compliance Agent  - 15% weight      │
│ 5. Risk Agent        - 10% weight      │
└────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│  RESULTS STORED IN DATABASE                         │
│  bids.ai_analysis (JSONB)                           │
│  bids.ai_rating (0-5)                               │
└─────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│  DISPLAYED TO USER                                  │
│  - Executive summary                                │
│  - Top recommendation with confidence               │
│  - Ranked quotes with scores                        │
│  - Key decision factors                             │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 ANALYSIS FLOW

### **Step-by-Step Journey:**

#### **1. User Initiates Analysis**
- User navigates to RFQ Quotes tab
- Clicks "Show AI Insights"
- Clicks "Analyze with AI"

#### **2. Frontend Request**
```javascript
const response = await fetch(`/api/rfq/${rfqId}/analyze-quotes`, {
  method: 'POST'
});
```

#### **3. API Endpoint Processes Request**
```javascript
// 1. Load RFQ with bids and documents
const rfq = await supabase
  .from('rfqs')
  .select(`
    *,
    insurance_products (name, category),
    bids (*, bid_documents (*))
  `)
  .eq('id', rfqId)
  .single();

// 2. Validate bid data
const validBids = rfq.bids.filter(bid =>
  (bid.bidder_company_name || bid.insurer_name) &&
  (bid.premium_amount || bid.coverage_amount)
);

// 3. Run AI analysis
const analysis = await orchestrateAnalysis(
  validBids,
  rfq,
  rfq.insurance_products.name
);
```

#### **4. Orchestrator Coordinates Sub-Agents**
```javascript
// Run all 5 agents in parallel
const [coverage, pricing, terms, compliance, risk] = await Promise.all([
  analyzeCoverage(quotes, rfq),
  analyzePricing(quotes, rfq, product),
  analyzeTerms(quotes),
  verifyCompliance(quotes, rfq, product),
  identifyRisks(quotes, rfq)
]);
```

#### **5. Each Sub-Agent Analyzes**
- Receives formatted quote data
- Sends prompt to Claude Sonnet 4
- Parses JSON response
- Returns structured analysis

#### **6. Orchestrator Synthesizes**
- Collects all sub-agent results
- Sends aggregated data to Claude Opus 4.1
- Receives comprehensive synthesis with:
  - Ranked quotes (with composite scores)
  - Executive summary
  - Top recommendation
  - Key decision factors
  - Important notes

#### **7. Results Saved to Database**
```javascript
await supabase
  .from('bids')
  .update({
    ai_analysis: {
      coverage: coverageAnalysis,
      pricing: pricingAnalysis,
      terms: termsAnalysis,
      compliance: complianceAnalysis,
      risk: riskAnalysis,
      synthesis: orchestratorSynthesis,
      analyzed_at: new Date().toISOString(),
      analysis_version: '1.0'
    },
    ai_rating: overallScore / 20 // Convert 0-100 to 0-5
  })
  .eq('id', bid.id);
```

#### **8. Response Returned to Frontend**
```json
{
  "success": true,
  "analysis": {
    "ranked_quotes": [...],
    "executive_summary": "...",
    "top_recommendation": {...},
    "key_decision_factors": [...],
    "important_notes": [...]
  },
  "metadata": {
    "quotes_analyzed": 2,
    "analysis_time_seconds": 28.5,
    "rfq_number": "RFQ-2025-0001",
    "insurance_product": "Fire and Special Perils Insurance"
  }
}
```

#### **9. UI Displays Results**
- Executive summary card (purple gradient)
- Top recommendation card (yellow gradient)
- Ranked quote cards (with scores, strengths, weaknesses)
- Decision factors list
- Important notes list

---

## 🤖 AI AGENTS

### **1. Coverage Analysis Agent**

**Purpose:** Analyze coverage completeness and gaps

**Model:** Claude Sonnet 4

**File:** `/apps/platform/src/lib/ai/agents/coverage-agent.js`

**Analysis Areas:**
- Coverage completeness for insurance product
- Coverage gaps or inadequate limits
- Add-on coverages included
- Sub-limits adequacy
- Territory/jurisdiction coverage
- Concerning exclusions

**Scoring Formula (0-100):**
- Comprehensiveness of coverage: 40 points
- Adequacy of limits: 30 points
- Breadth of add-ons: 20 points
- Minimal exclusions: 10 points

**Output Structure:**
```json
{
  "quotes": [
    {
      "quote_id": "uuid",
      "coverage_score": 85,
      "completeness": "Comprehensive/Adequate/Limited/Inadequate",
      "gaps": ["Specific coverage gaps"],
      "strengths": ["Coverage strengths"],
      "red_flags": ["Critical concerns"],
      "add_ons_included": ["Additional coverages"],
      "exclusions_concern": ["Concerning exclusions"]
    }
  ],
  "comparative_analysis": "2-3 sentence comparison"
}
```

---

### **2. Pricing Comparison Agent**

**Purpose:** Analyze pricing competitiveness and value

**Model:** Claude Sonnet 4

**File:** `/apps/platform/src/lib/ai/agents/pricing-agent.js`

**Analysis Areas:**
- Premium competitiveness vs. market rates
- Value for money (premium efficiency ratio)
- Deductible impact on pricing
- Add-on pricing fairness
- Hidden costs or loading factors

**Scoring Formula (0-100):**
- Absolute premium competitiveness: 40 points
- Value for money / premium efficiency: 40 points
- Transparency / no hidden costs: 20 points

**Key Metric:**
```
Premium Efficiency = (Premium / Coverage Amount) × 100,000
```
(Shows premium per ₹1 lakh of coverage)

**Output Structure:**
```json
{
  "quotes": [
    {
      "quote_id": "uuid",
      "pricing_score": 85,
      "value_rating": "Excellent/Good/Fair/Poor",
      "premium_efficiency": 0.XX,
      "competitive_position": "Most Competitive/Competitive/Average/Expensive",
      "value_highlights": ["Reasons for good value"],
      "pricing_concerns": ["Pricing or hidden cost concerns"]
    }
  ],
  "best_value": "quote_id",
  "market_insights": "2-3 sentence pricing analysis"
}
```

---

### **3. Terms & Conditions Agent**

**Purpose:** Analyze policy terms and favorability

**Model:** Claude Sonnet 4

**File:** `/apps/platform/src/lib/ai/agents/terms-agent.js`

**Analysis Areas:**
- Material policy exclusions
- Claims process complexity
- Notice periods and documentation requirements
- Renewal and cancellation terms
- Dispute resolution mechanisms
- Overall favorability

**Scoring Formula (0-100):**
- Minimal exclusions: 30 points
- Simple claims process: 30 points
- Favorable renewal/cancellation terms: 20 points
- Fair dispute resolution: 20 points

**Output Structure:**
```json
{
  "quotes": [
    {
      "quote_id": "uuid",
      "terms_score": 75,
      "favorability": "Client-Friendly/Balanced/Insurer-Favorable",
      "key_exclusions": ["Material exclusions"],
      "claims_complexity": "Simple/Moderate/Complex",
      "red_flags": ["Unfavorable terms"],
      "positive_terms": ["Favorable terms"]
    }
  ],
  "comparative_summary": "2-3 sentence comparison"
}
```

---

### **4. Compliance Verification Agent**

**Purpose:** Verify regulatory and statutory compliance

**Model:** Claude Sonnet 4

**File:** `/apps/platform/src/lib/ai/agents/compliance-agent.js`

**Analysis Areas:**
- IRDAI regulations compliance
- Mandatory coverages inclusion
- Statutory requirements (Workmen's Compensation Act, etc.)
- Industry-specific regulations
- Documentation completeness

**Scoring Formula (0-100):**
- Regulatory compliance: 40 points
- Statutory requirements met: 40 points
- Documentation completeness: 20 points

**Output Structure:**
```json
{
  "quotes": [
    {
      "quote_id": "uuid",
      "compliance_score": 90,
      "regulatory_status": "Compliant/Non-Compliant/Needs Verification",
      "mandatory_coverages_met": true,
      "missing_requirements": ["Missing mandatory coverages"],
      "compliance_risks": ["Potential compliance issues"]
    }
  ],
  "overall_assessment": "2-3 sentence compliance assessment"
}
```

---

### **5. Risk Identification Agent**

**Purpose:** Identify risks associated with each quote

**Model:** Claude Sonnet 4

**File:** `/apps/platform/src/lib/ai/agents/risk-agent.js`

**Analysis Areas:**
- Underinsurance risk (inadequate coverage limits)
- Coverage gaps exposing client to losses
- Insurer financial strength concerns
- Claims settlement track record
- Policy term risks (auto-renewal, cancellation)
- Operational risks (claims process complexity)

**Scoring Formula (0-100 where LOWER is better):**
- 0-30: Low Risk (excellent choice)
- 31-50: Medium Risk (acceptable with minor concerns)
- 51-70: High Risk (significant concerns)
- 71-100: Critical Risk (not recommended)

**Output Structure:**
```json
{
  "quotes": [
    {
      "quote_id": "uuid",
      "risk_score": 25,
      "risk_level": "Low/Medium/High/Critical",
      "identified_risks": [
        {
          "risk": "Specific risk",
          "severity": "Critical/High/Medium/Low",
          "mitigation": "How to mitigate"
        }
      ],
      "insurer_stability": "Strong/Stable/Concerns/Unknown"
    }
  ],
  "overall_risk_assessment": "2-3 sentence risk summary"
}
```

---

### **6. Orchestrator Agent**

**Purpose:** Synthesize all analyses into final recommendation

**Model:** Claude Opus 4.1 (higher quality synthesis)

**File:** `/apps/platform/src/lib/ai/agents/orchestrator.js`

**Input:** All 5 sub-agent analyses + RFQ context

**Composite Scoring Formula:**
```
Overall Score =
  (coverage_score × 0.30) +
  (pricing_score × 0.25) +
  (terms_score × 0.20) +
  (compliance_score × 0.15) +
  ((100 - risk_score) × 0.10)
```

**Recommendation Labels:**
- **90-100:** "Highly Recommended"
- **75-89:** "Recommended"
- **60-74:** "Consider"
- **Below 60:** "Not Recommended"

**Output Structure:**
```json
{
  "ranked_quotes": [
    {
      "quote_id": "uuid",
      "overall_score": 85,
      "rank": 1,
      "insurer_name": "HDFC ERGO",
      "premium": 50000,
      "recommendation_label": "Highly Recommended",
      "strengths": ["Top 3-4 strengths in plain language"],
      "weaknesses": ["Top 2-3 weaknesses"],
      "best_for": "What type of client this is best for"
    }
  ],
  "executive_summary": "3-4 sentence plain-language summary",
  "top_recommendation": {
    "quote_id": "uuid",
    "reason": "2-3 sentence explanation",
    "confidence": 85
  },
  "key_decision_factors": [
    "3-5 key factors to consider"
  ],
  "important_notes": [
    "Critical warnings or next steps"
  ]
}
```

---

## 📊 DATA REQUIREMENTS

### **Minimum Required Data for AI Analysis:**

Each bid must have:

✅ **Basic Information:**
- `bidder_company_name` OR `insurer_name` (at least one)

✅ **Financial Data:**
- `premium_amount` OR `coverage_amount` (at least one)

**Optional but Recommended:**
- `coverage_amount` - Total coverage limit
- `deductible` - Deductible amount
- `policy_term_months` - Policy duration
- `additional_terms` - Text description of terms
- `bid_documents` - Uploaded quote files with `parsed_data`

### **Data Validation:**

Before analysis, the API filters bids:

```javascript
const validBids = rfq.bids.filter(bid => {
  const hasBasicInfo = bid.bidder_company_name || bid.insurer_name;
  const hasFinancialData = bid.premium_amount || bid.coverage_amount;
  return hasBasicInfo && hasFinancialData;
});
```

If no valid bids, returns:
```json
{
  "error": "Insufficient bid data for AI analysis",
  "details": "Bids must include company name and at least premium or coverage amount"
}
```

---

## 🌐 API ENDPOINTS

### **POST /api/rfq/[id]/analyze-quotes**

**Purpose:** Run AI analysis on all quotes for an RFQ

**Authentication:** Required (user must own RFQ)

**Request:**
```javascript
POST /api/rfq/abc-123/analyze-quotes
// No body required
```

**Success Response (200):**
```json
{
  "success": true,
  "analysis": {
    "ranked_quotes": [...],
    "executive_summary": "...",
    "top_recommendation": {...},
    "key_decision_factors": [...],
    "important_notes": [...]
  },
  "metadata": {
    "quotes_analyzed": 2,
    "quotes_total": 2,
    "quotes_skipped": 0,
    "analysis_time_seconds": 28.5,
    "rfq_number": "RFQ-2025-0001",
    "insurance_product": "Fire and Special Perils Insurance"
  }
}
```

**Error Responses:**

**400 - No Quotes:**
```json
{
  "error": "No quotes submitted yet. Please wait for insurers to submit quotes."
}
```

**400 - Insufficient Data:**
```json
{
  "error": "Insufficient bid data for AI analysis",
  "details": "Bids must include company name and at least premium or coverage amount",
  "suggestion": "Please ensure bidders provide complete quote information"
}
```

**404 - RFQ Not Found:**
```json
{
  "error": "RFQ not found"
}
```

**500 - Analysis Failed:**
```json
{
  "error": "Failed to analyze quotes",
  "details": "Coverage agent failed: Parsing error",
  "suggestion": "Please try again or contact support if the issue persists"
}
```

---

### **GET /api/rfq/[id]/analyze-quotes**

**Purpose:** Retrieve cached analysis results

**Authentication:** Required

**Request:**
```javascript
GET /api/rfq/abc-123/analyze-quotes
```

**Success Response (200):**
```json
{
  "success": true,
  "analysis": {...},
  "from_cache": true
}
```

**Error Response (404):**
```json
{
  "error": "No analysis found. Please run analysis first."
}
```

---

## 🎨 FRONTEND COMPONENTS

### **AIInsightsPanel Component**

**File:** `/apps/platform/src/app/rfq/[id]/components/AIInsightsPanel.js`

**Purpose:** Display AI analysis results in beautiful, user-friendly interface

**States:**
- **Before Analysis:** Trigger card with "Analyze with AI" button
- **During Analysis:** Progress messages
- **After Analysis:** Complete insights display

**Features:**
- Executive Summary Card (purple gradient)
- Top Recommendation Card (yellow gradient)
- Ranked Quotes Grid (responsive, auto-fill)
- Key Decision Factors List
- Important Notes List
- Re-analyze Button

**Props:**
```javascript
<AIInsightsPanel
  rfqId={rfqId}
  onAnalysisComplete={(analysis) => {
    console.log('Analysis complete:', analysis);
  }}
/>
```

**CSS:** `/apps/platform/src/app/rfq/[id]/components/ai-insights.css`

---

## 📈 SCORING METHODOLOGY

### **Individual Agent Scores (0-100):**

Each agent assigns a score based on its specific criteria:

| Agent | Score Range | Meaning |
|-------|-------------|---------|
| Coverage | 0-100 | Higher = More comprehensive coverage |
| Pricing | 0-100 | Higher = Better value for money |
| Terms | 0-100 | Higher = More favorable terms |
| Compliance | 0-100 | Higher = Better compliance |
| Risk | 0-100 | **Lower = Less risky (inverted)** |

---

### **Composite Score Calculation:**

```javascript
overallScore =
  (coverageScore × 0.30) +
  (pricingScore × 0.25) +
  (termsScore × 0.20) +
  (complianceScore × 0.15) +
  ((100 - riskScore) × 0.10)
```

**Weights Rationale:**
- **Coverage (30%)** - Most important: adequate coverage prevents losses
- **Pricing (25%)** - Critical: must be cost-effective
- **Terms (20%)** - Important: favorable terms ease claims
- **Compliance (15%)** - Essential: avoid legal/regulatory risk
- **Risk (10%)** - Secondary: usually correlates with other factors

---

### **Recommendation Labels:**

| Overall Score | Label | Meaning |
|---------------|-------|---------|
| 90-100 | Highly Recommended | Excellent choice, minimal concerns |
| 75-89 | Recommended | Good choice, minor concerns |
| 60-74 | Consider | Acceptable with caveats |
| Below 60 | Not Recommended | Significant concerns |

---

### **AI Rating (0-5 stars):**

Stored in `bids.ai_rating`:

```javascript
aiRating = overallScore / 20
```

| Overall Score | AI Rating |
|---------------|-----------|
| 90-100 | 4.5 - 5.0 ⭐⭐⭐⭐⭐ |
| 75-89 | 3.75 - 4.4 ⭐⭐⭐⭐ |
| 60-74 | 3.0 - 3.7 ⭐⭐⭐ |
| Below 60 | 0 - 2.9 ⭐⭐ |

---

## ⚠️ ERROR HANDLING

### **Graceful Degradation Strategy:**

1. **Individual Agent Failure:**
   - Agent returns error object instead of throwing
   - Orchestrator continues with other agents
   - Logs which agent failed
   - Uses fallback data for failed agent

2. **Multiple Agent Failures:**
   - If 1-2 agents fail: Synthesis continues with partial data
   - If 3+ agents fail: Falls back to manual synthesis
   - Always returns a response (never complete failure)

3. **Orchestrator Failure:**
   - Falls back to `createFallbackSynthesis()`
   - Returns basic ranking based on available data
   - Shows "AI analysis unavailable" message

---

### **Error Logging:**

All errors are logged with context:

```javascript
console.error('[Agent Name] Error:', {
  message: error.message,
  stack: error.stack?.substring(0, 500),
  // Additional context
});
```

**Where to Check Logs:**
1. **Browser Console** - Client-side errors
2. **Vercel Function Logs** - Server-side errors
3. **Supabase Logs** - Database errors

---

## ⚡ PERFORMANCE

### **Execution Time:**

| Stage | Time | Details |
|-------|------|---------|
| API Setup | 1-2s | Load RFQ + bids from database |
| Sub-Agents (Parallel) | 15-20s | All 5 agents run simultaneously |
| Orchestrator Synthesis | 8-10s | Claude Opus 4.1 synthesis |
| Database Save | 1-2s | Save results to bids table |
| **Total** | **25-35s** | End-to-end analysis time |

**Note:** Sequential execution would take ~100s (5 agents × 20s each)

---

### **Optimization Strategies:**

1. **Parallel Execution** - All 5 sub-agents run at once (Promise.all)
2. **Caching** - Results saved in database, retrieved instantly
3. **Data Formatting** - Remove unnecessary fields before sending to AI
4. **Token Efficiency** - Prompts optimized for minimal tokens

---

### **Rate Limits:**

**Anthropic API:**
- Default: 50 requests/minute
- Check your tier at https://console.anthropic.com

**Vercel Functions:**
- Hobby: 60s timeout
- Pro: 300s timeout (upgrade if needed)

---

## 💰 COST ANALYSIS

### **Per Analysis Costs:**

| Model | Usage | Cost per Analysis |
|-------|-------|-------------------|
| **Claude Opus 4.1** (Orchestrator) | ~3,000 input + ~1,500 output tokens | ~₹42 ($0.50) |
| **Claude Sonnet 4** (5 agents) | ~10,000 input + ~2,500 output tokens | ~₹25 ($0.30) |
| **Total per Analysis** | 5 quotes | **~₹67 ($0.80)** |

---

### **Monthly Projections:**

**Scenario: 100 RFQs/month**

| Metric | Value |
|--------|-------|
| RFQs analyzed | 100 |
| Avg quotes per RFQ | 5 |
| Cost per analysis | ₹67 |
| **Total AI Cost** | **₹6,700/month** |
| Revenue (₹1,599/RFQ) | ₹159,900 |
| **Profit Margin** | **95.8%** |

---

### **Cost Optimization Tips:**

1. **Cache aggressively** - Don't re-analyze same quotes
2. **Reduce token usage** - Send only necessary data to AI
3. **Batch processing** - Analyze multiple RFQs in parallel
4. **Monitor usage** - Set alerts for unusual spikes

---

## 🔧 TROUBLESHOOTING

### **Issue: Analysis returns "AI analysis unavailable"**

**Check:**
1. Browser console for error messages
2. Which agent failed (logged in console)
3. Vercel function logs for detailed errors

**Common Causes:**
- Invalid `ANTHROPIC_API_KEY`
- API rate limit exceeded
- JSON parsing error (Claude returned unexpected format)
- Missing bid data

**Solution:**
- Verify API key is set correctly in Vercel
- Check Anthropic dashboard for usage/errors
- Review Vercel function logs for specific error

---

### **Issue: Analysis takes too long (>60s)**

**Cause:** Too many quotes or large documents

**Solution:**
1. Upgrade Vercel plan (Hobby → Pro for 300s timeout)
2. Reduce number of quotes analyzed
3. Optimize document size before upload

---

### **Issue: Inconsistent or low-quality recommendations**

**Cause:** Insufficient bid data or vague prompts

**Solution:**
1. Ensure bids have complete data (premium, coverage, terms)
2. Upload detailed quote documents
3. Consider refining agent prompts for better results

---

### **Issue: Cost exceeding budget**

**Cause:** Too many analyses or re-analyses

**Solution:**
1. Implement analysis quotas per user
2. Cache results more aggressively
3. Add "Are you sure?" confirmation before re-analyze
4. Consider cheaper models for sub-agents (if quality acceptable)

---

## 📚 ADDITIONAL RESOURCES

### **Key Files:**

| File | Purpose |
|------|---------|
| `/apps/platform/src/lib/ai/langchain-setup.js` | Model configuration, JSON parsing |
| `/apps/platform/src/lib/ai/agents/orchestrator.js` | Main orchestration logic |
| `/apps/platform/src/lib/ai/agents/coverage-agent.js` | Coverage analysis |
| `/apps/platform/src/lib/ai/agents/pricing-agent.js` | Pricing analysis |
| `/apps/platform/src/lib/ai/agents/terms-agent.js` | Terms analysis |
| `/apps/platform/src/lib/ai/agents/compliance-agent.js` | Compliance verification |
| `/apps/platform/src/lib/ai/agents/risk-agent.js` | Risk identification |
| `/apps/platform/src/app/api/rfq/[id]/analyze-quotes/route.js` | API endpoint |
| `/apps/platform/src/app/rfq/[id]/components/AIInsightsPanel.js` | UI component |

---

### **External Documentation:**

- **Anthropic API:** https://docs.anthropic.com
- **LangChain:** https://js.langchain.com/docs
- **Claude Models:** https://docs.anthropic.com/claude/docs/models-overview

---

**End of Documentation** 📖

For questions or issues, contact support or check Vercel/Supabase logs.
