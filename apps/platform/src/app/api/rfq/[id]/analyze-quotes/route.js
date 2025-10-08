/**
 * API Endpoint: AI Quote Analysis
 * Route: POST /api/rfq/[id]/analyze-quotes
 * Purpose: Analyze all quotes for an RFQ using multi-agent AI system
 */

import { createClient } from '@sanctuari/database/lib/server';
import { NextResponse } from 'next/server';
import { orchestrateAnalysis } from '@/lib/ai/agents/orchestrator';

export async function POST(request, { params }) {
  try {
    const supabase = createClient();
    const { id: rfqId } = await params;

    console.log(`[Analyze Quotes] Starting analysis for RFQ: ${rfqId}`);

    // Load RFQ with all related data
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select(`
        *,
        insurance_products (name, category),
        companies (name),
        bids (
          *,
          bid_documents (*)
        )
      `)
      .eq('id', rfqId)
      .single();

    if (rfqError || !rfq) {
      console.error('[Analyze Quotes] RFQ not found:', rfqError);
      return NextResponse.json(
        { error: 'RFQ not found' },
        { status: 404 }
      );
    }

    if (!rfq.bids || rfq.bids.length === 0) {
      console.log('[Analyze Quotes] No quotes to analyze');
      return NextResponse.json(
        { error: 'No quotes submitted yet. Please wait for insurers to submit quotes.' },
        { status: 400 }
      );
    }

    console.log(`[Analyze Quotes] Found ${rfq.bids.length} quotes to analyze`);

    // Run AI analysis
    const startTime = Date.now();
    const analysis = await orchestrateAnalysis(
      rfq.bids,
      rfq,
      rfq.insurance_products.name
    );
    const analysisTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`[Analyze Quotes] Analysis complete in ${analysisTime}s`);

    // Store analysis results in database
    const updatePromises = rfq.bids.map(async (bid) => {
      const bidAnalysis = analysis.orchestratorSynthesis.ranked_quotes
        ?.find(q => q.quote_id === bid.id);

      if (bidAnalysis) {
        const aiAnalysisData = {
          coverage: analysis.coverageAnalysis?.quotes?.find(q => q.quote_id === bid.id) || null,
          pricing: analysis.pricingAnalysis?.quotes?.find(q => q.quote_id === bid.id) || null,
          terms: analysis.termsAnalysis?.quotes?.find(q => q.quote_id === bid.id) || null,
          compliance: analysis.complianceAnalysis?.quotes?.find(q => q.quote_id === bid.id) || null,
          risk: analysis.riskAnalysis?.quotes?.find(q => q.quote_id === bid.id) || null,
          synthesis: bidAnalysis,
          analyzed_at: new Date().toISOString(),
          analysis_version: '1.0'
        };

        const aiRating = bidAnalysis.overall_score ? bidAnalysis.overall_score / 20 : null; // Convert 0-100 to 0-5

        return supabase
          .from('bids')
          .update({
            ai_analysis: aiAnalysisData,
            ai_rating: aiRating
          })
          .eq('id', bid.id);
      }
    });

    await Promise.all(updatePromises.filter(Boolean));

    console.log('[Analyze Quotes] Results saved to database');

    return NextResponse.json({
      success: true,
      analysis: analysis.orchestratorSynthesis,
      metadata: {
        quotes_analyzed: rfq.bids.length,
        analysis_time_seconds: parseFloat(analysisTime),
        rfq_number: rfq.rfq_number,
        insurance_product: rfq.insurance_products.name
      }
    });

  } catch (error) {
    console.error('[Analyze Quotes] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze quotes',
        details: error.message,
        suggestion: 'Please try again or contact support if the issue persists'
      },
      { status: 500 }
    );
  }
}

/**
 * GET method to retrieve existing analysis
 */
export async function GET(request, { params }) {
  try {
    const supabase = createClient();
    const { id: rfqId } = await params;

    const { data: bids, error } = await supabase
      .from('bids')
      .select('id, ai_analysis, ai_rating, insurer_name, bidder_company_name, premium_amount')
      .eq('rfq_id', rfqId)
      .not('ai_analysis', 'is', null);

    if (error) throw error;

    if (!bids || bids.length === 0) {
      return NextResponse.json(
        { error: 'No analysis found. Please run analysis first.' },
        { status: 404 }
      );
    }

    // Reconstruct orchestrator synthesis from stored data
    const rankedQuotes = bids.map(bid => bid.ai_analysis?.synthesis).filter(Boolean);

    return NextResponse.json({
      success: true,
      analysis: {
        ranked_quotes: rankedQuotes,
        executive_summary: bids[0]?.ai_analysis?.synthesis?.executive_summary || '',
        top_recommendation: rankedQuotes[0] ? {
          quote_id: rankedQuotes[0].quote_id,
          reason: rankedQuotes[0].strengths?.join('. ') || ''
        } : null
      },
      from_cache: true
    });

  } catch (error) {
    console.error('[Get Analysis] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analysis' },
      { status: 500 }
    );
  }
}
