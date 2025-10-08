/**
 * LangChain Setup for Sanctuari AI Analysis
 * Purpose: Configure Claude AI models for quote analysis
 * Models: Opus 4.1 (orchestrator), Sonnet 4 (sub-agents)
 */

import { ChatAnthropic } from '@langchain/anthropic';

/**
 * Create orchestrator agent using Claude Opus 4.1
 * Used for high-level synthesis and coordination
 */
export const createOrchestrator = () => {
  return new ChatAnthropic({
    modelName: 'claude-opus-4-20250514',
    temperature: 0.3,
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxTokens: 4096
  });
};

/**
 * Create sub-agent using Claude Sonnet 4
 * Used for specialized analysis tasks (coverage, pricing, terms, etc.)
 */
export const createSubAgent = () => {
  return new ChatAnthropic({
    modelName: 'claude-3-5-sonnet-20241022',
    temperature: 0.2,
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxTokens: 4096
  });
};

/**
 * Parse JSON response from AI agent
 * Handles various response formats including markdown-wrapped JSON
 */
export const parseAIResponse = (response) => {
  try {
    // Extract content from LangChain response
    let content;

    if (typeof response === 'string') {
      content = response;
    } else if (response && typeof response === 'object') {
      // Handle LangChain AIMessage object
      if (response.content) {
        content = response.content;
      } else if (response.text) {
        content = response.text;
      } else if (response.lc_kwargs && response.lc_kwargs.content) {
        content = response.lc_kwargs.content;
      } else {
        content = JSON.stringify(response);
      }
    } else {
      throw new Error('Invalid response format');
    }

    // Remove markdown code blocks if present
    // Handles: ```json\n{...}\n``` or ```\n{...}\n```
    let cleanContent = content.trim();

    const markdownJsonMatch = cleanContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (markdownJsonMatch) {
      cleanContent = markdownJsonMatch[1].trim();
    }

    // Remove any leading/trailing whitespace
    cleanContent = cleanContent.trim();

    // Try to parse as JSON
    const parsed = JSON.parse(cleanContent);

    // Validate that we got an object
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Parsed result is not a valid object');
    }

    return parsed;

  } catch (error) {
    console.error('[parseAIResponse] Failed to parse AI response:', {
      error: error.message,
      responseType: typeof response,
      responseKeys: response && typeof response === 'object' ? Object.keys(response) : [],
      contentPreview: typeof response === 'string'
        ? response.substring(0, 200)
        : JSON.stringify(response).substring(0, 200)
    });

    // Return error structure
    return {
      error: 'Failed to parse response',
      errorMessage: error.message,
      raw: typeof response === 'string' ? response.substring(0, 500) : 'Non-string response'
    };
  }
};

/**
 * Format quote data for AI consumption
 * Removes unnecessary fields and formats for optimal token usage
 */
export const formatQuotesForAI = (quotes) => {
  return quotes.map(quote => ({
    quote_id: quote.id,
    insurer_name: quote.insurer_name || quote.bidder_company_name,
    bidder_company: quote.bidder_company_name,
    bidder_contact: quote.bidder_contact_person,
    bidder_email: quote.bidder_email,
    premium_amount: quote.premium_amount,
    coverage_amount: quote.coverage_amount,
    deductible: quote.deductible,
    policy_term_months: quote.policy_term_months,
    additional_terms: quote.additional_terms,
    documents: quote.bid_documents?.map(doc => ({
      file_name: doc.file_name,
      parsed_data: doc.parsed_data
    })),
    submitted_at: quote.created_at
  }));
};

/**
 * Format RFQ data for AI consumption
 */
export const formatRFQForAI = (rfq) => {
  return {
    rfq_number: rfq.rfq_number,
    title: rfq.title,
    description: rfq.description,
    product_name: rfq.insurance_products?.name,
    product_category: rfq.insurance_products?.category,
    company_name: rfq.companies?.name,
    deadline: rfq.deadline,
    status: rfq.status
  };
};
