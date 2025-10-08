/**
 * Component: AI Insights Panel
 * Purpose: Display AI-powered quote analysis and recommendations
 * Features: Executive summary, ranked quotes, detailed insights
 */

import { useState } from 'react';
import { Card, Button } from '@sanctuari/ui';
import './ai-insights.css';

export default function AIInsightsPanel({ rfqId, onAnalysisComplete }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    setProgress('Initializing AI analysis...');

    try {
      setProgress('Running multi-agent analysis...');

      const response = await fetch(`/api/rfq/${rfqId}/analyze-quotes`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setProgress('Analysis complete!');
      setAnalysis(data.analysis);

      if (onAnalysisComplete) {
        onAnalysisComplete(data.analysis);
      }

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message);
    } finally {
      setAnalyzing(false);
      setProgress('');
    }
  };

  if (!analysis) {
    return (
      <Card className="ai-insights-trigger">
        <div className="ai-trigger-content">
          <div className="ai-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <h3>AI-Powered Quote Analysis</h3>
          <p>Get intelligent insights, recommendations, and comparative analysis powered by Claude AI</p>
          <p className="ai-features">
            <span>✓ Coverage Analysis</span>
            <span>✓ Pricing Comparison</span>
            <span>✓ Terms Review</span>
            <span>✓ Compliance Check</span>
            <span>✓ Risk Assessment</span>
          </p>
          <Button
            onClick={handleAnalyze}
            disabled={analyzing}
            size="large"
          >
            {analyzing ? progress || 'Analyzing Quotes...' : 'Analyze with AI'}
          </Button>
          {error && (
            <div className="error-message">
              <strong>Analysis Failed:</strong> {error}
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="ai-insights-panel">
      {/* Executive Summary */}
      <Card className="ai-summary-card">
        <div className="ai-header">
          <div className="ai-badge">AI Analysis</div>
          <h3>Executive Summary</h3>
        </div>
        <p className="ai-summary">{analysis.executive_summary}</p>
      </Card>

      {/* Top Recommendation */}
      {analysis.top_recommendation && analysis.top_recommendation.confidence > 0 && (
        <Card className="ai-recommendation-card">
          <div className="recommendation-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <h3>Top Recommendation</h3>
          </div>
          <div className="recommendation-content">
            <div className="recommendation-quote">
              <strong>{analysis.ranked_quotes?.find(q => q.quote_id === analysis.top_recommendation.quote_id)?.insurer_name}</strong>
              <div className="confidence-bar-container">
                <div className="confidence-bar">
                  <div
                    className="confidence-level"
                    style={{width: `${analysis.top_recommendation.confidence}%`}}
                  ></div>
                </div>
                <span className="confidence-text">{analysis.top_recommendation.confidence}% Confidence</span>
              </div>
            </div>
            <p className="recommendation-reason">{analysis.top_recommendation.reason}</p>
          </div>
        </Card>
      )}

      {/* Ranked Quotes */}
      <div className="ranked-quotes-section">
        <h3 className="section-title">Detailed Quote Analysis</h3>
        <div className="ranked-quotes-grid">
          {analysis.ranked_quotes?.map((quote) => (
            <Card key={quote.quote_id} className={`ranked-quote-card rank-${quote.rank}`}>
              <div className="quote-rank-badge">#{quote.rank}</div>
              <div className="quote-header">
                <h4>{quote.insurer_name}</h4>
                <span className={`recommendation-label label-${quote.recommendation_label?.toLowerCase().replace(/\s+/g, '-')}`}>
                  {quote.recommendation_label}
                </span>
              </div>

              <div className="quote-premium">
                Premium: ₹{quote.premium?.toLocaleString('en-IN') || 'N/A'}
              </div>

              <div className="quote-score">
                <div className="score-circle">
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="35" fill="none" stroke="#f0f0f0" strokeWidth="8"/>
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      fill="none"
                      stroke="#6F4FFF"
                      strokeWidth="8"
                      strokeDasharray={`${(quote.overall_score || 0) * 2.2} 220`}
                      strokeDashoffset="0"
                      transform="rotate(-90 40 40)"
                    />
                  </svg>
                  <span className="score-value">{quote.overall_score || 0}</span>
                </div>
                <span className="score-label">Overall Score</span>
              </div>

              <div className="quote-strengths">
                <strong>Strengths:</strong>
                <ul>
                  {quote.strengths?.map((strength, idx) => (
                    <li key={idx}>{strength}</li>
                  ))}
                </ul>
              </div>

              {quote.weaknesses && quote.weaknesses.length > 0 && (
                <div className="quote-weaknesses">
                  <strong>Weaknesses:</strong>
                  <ul>
                    {quote.weaknesses.map((weakness, idx) => (
                      <li key={idx}>{weakness}</li>
                    ))}
                  </ul>
                </div>
              )}

              {quote.best_for && (
                <div className="quote-best-for">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                  </svg>
                  <span>{quote.best_for}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Key Decision Factors */}
      {analysis.key_decision_factors && analysis.key_decision_factors.length > 0 && (
        <Card className="decision-factors-card">
          <h3>Key Decision Factors</h3>
          <ul className="decision-factors-list">
            {analysis.key_decision_factors.map((factor, idx) => (
              <li key={idx}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {factor}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Important Notes */}
      {analysis.important_notes && analysis.important_notes.length > 0 && (
        <Card className="important-notes-card">
          <h3>Important Notes</h3>
          <ul className="important-notes-list">
            {analysis.important_notes.map((note, idx) => (
              <li key={idx}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {note}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="ai-actions">
        <Button variant="secondary" onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? 'Re-analyzing...' : 'Re-analyze Quotes'}
        </Button>
      </div>
    </div>
  );
}
