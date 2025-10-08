/**
 * EnhancedComparison Component
 * Displays product-aware quote comparison with intelligent field matching
 */

import { useMemo, useState } from 'react';
import { Card, Button } from '@sanctuari/ui';
import { compareQuotes } from '@/lib/quote-comparison/comparison-engine';
import './enhanced-comparison.css';

export default function EnhancedComparison({ productName, quotes }) {
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' or 'cards'

  // Run comparison engine
  const comparisonData = useMemo(() => {
    if (!quotes || quotes.length === 0) return null;
    return compareQuotes(productName, quotes);
  }, [productName, quotes]);

  if (!comparisonData) {
    return (
      <Card className="enhanced-comparison-empty">
        <p>No quotes available for comparison</p>
      </Card>
    );
  }

  return (
    <div className="enhanced-comparison">
      {/* Header */}
      <div className="comparison-header">
        <div className="comparison-title">
          <h3>Enhanced Quote Comparison</h3>
          <p className="comparison-subtitle">
            {comparisonData.quotesCompared} quotes for {comparisonData.productName}
            {comparisonData.category && ` (${comparisonData.category})`}
          </p>
        </div>
        <div className="comparison-view-toggle">
          <button
            className={`view-btn ${viewMode === 'matrix' ? 'active' : ''}`}
            onClick={() => setViewMode('matrix')}
          >
            Table View
          </button>
          <button
            className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            Card View
          </button>
        </div>
      </div>

      {/* Insights */}
      {comparisonData.insights && comparisonData.insights.length > 0 && (
        <div className="comparison-insights">
          {comparisonData.insights.map((insight, idx) => (
            <div key={idx} className={`insight-card severity-${insight.severity}`}>
              <div className="insight-icon">
                {insight.severity === 'high' ? '⚠️' : insight.severity === 'medium' ? 'ℹ️' : '✓'}
              </div>
              <div className="insight-content">
                <strong>{insight.title}</strong>
                <p>{insight.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Best Quotes Summary */}
      {comparisonData.bestQuotes && (
        <div className="best-quotes-summary">
          <h4>Quick Highlights</h4>
          <div className="best-quotes-grid">
            {comparisonData.bestQuotes.lowestPremium && (
              <div className="best-quote-card">
                <div className="best-quote-label">Lowest Premium</div>
                <div className="best-quote-value">{comparisonData.bestQuotes.lowestPremium.formatted}</div>
                <div className="best-quote-insurer">{comparisonData.bestQuotes.lowestPremium.insurerName}</div>
              </div>
            )}
            {comparisonData.bestQuotes.highestCoverage && (
              <div className="best-quote-card">
                <div className="best-quote-label">Highest Coverage</div>
                <div className="best-quote-value">{comparisonData.bestQuotes.highestCoverage.formatted}</div>
                <div className="best-quote-insurer">{comparisonData.bestQuotes.highestCoverage.insurerName}</div>
              </div>
            )}
            {comparisonData.bestQuotes.bestValue && (
              <div className="best-quote-card highlight">
                <div className="best-quote-label">Best Value</div>
                <div className="best-quote-value">Score: {comparisonData.bestQuotes.bestValue.valueScore}/100</div>
                <div className="best-quote-insurer">{comparisonData.bestQuotes.bestValue.insurerName}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comparison Matrix (Table View) */}
      {viewMode === 'matrix' && comparisonData.comparisonMatrix && (
        <div className="comparison-matrix-container">
          <div className="comparison-matrix">
            <table>
              <thead>
                <tr>
                  {comparisonData.comparisonMatrix.headers.map((header, idx) => (
                    <th key={idx} className={idx === 0 ? 'field-column' : 'quote-column'}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonData.comparisonMatrix.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className={row.critical ? 'critical-row' : ''}>
                    <td className="field-name">
                      {row.field}
                      {row.critical && <span className="critical-badge">Critical</span>}
                    </td>
                    {row.values.map((value, colIdx) => (
                      <td
                        key={colIdx}
                        className={`
                          quote-value
                          ${row.bestIndex === colIdx ? 'best-value' : ''}
                          ${value.raw === null ? 'missing-value' : ''}
                        `}
                      >
                        {value.formatted}
                        {row.bestIndex === colIdx && <span className="best-badge">Best</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Card View */}
      {viewMode === 'cards' && comparisonData.normalizedQuotes && (
        <div className="comparison-cards">
          {comparisonData.normalizedQuotes.map((quote, idx) => (
            <Card key={idx} className="comparison-quote-card">
              <div className="quote-card-header">
                <h4>{quote.insurerName}</h4>
                {comparisonData.valueMetrics && comparisonData.valueMetrics[idx]?.valueScore && (
                  <div className="value-score">
                    Value Score: {comparisonData.valueMetrics[idx].valueScore}/100
                  </div>
                )}
              </div>
              <div className="quote-card-fields">
                {Object.entries(quote.fields).map(([fieldName, field]) => (
                  <div key={fieldName} className={`field-row ${field.critical ? 'critical' : ''}`}>
                    <div className="field-label">
                      {field.label}
                      {field.critical && <span className="critical-star">*</span>}
                    </div>
                    <div className="field-value">
                      {field.formatted}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Value Metrics Table */}
      {comparisonData.valueMetrics && comparisonData.valueMetrics.some(m => m.premiumEfficiency) && (
        <div className="value-metrics-section">
          <h4>Value Analysis</h4>
          <div className="value-metrics-table">
            <table>
              <thead>
                <tr>
                  <th>Insurer</th>
                  <th>Premium</th>
                  <th>Coverage</th>
                  <th>Premium per ₹1L</th>
                  <th>Coverage per ₹1 Premium</th>
                  <th>Value Score</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.valueMetrics.map((metric, idx) => (
                  <tr key={idx} className={metric.valueScore >= 80 ? 'high-value' : ''}>
                    <td>{metric.insurerName}</td>
                    <td>{metric.premium ? `₹${metric.premium.toLocaleString('en-IN')}` : 'N/A'}</td>
                    <td>{metric.sumInsured ? `₹${metric.sumInsured.toLocaleString('en-IN')}` : 'N/A'}</td>
                    <td>
                      {metric.premiumEfficiency
                        ? `₹${metric.premiumEfficiency.toFixed(2)}`
                        : 'N/A'}
                    </td>
                    <td>
                      {metric.coverageRatio
                        ? `₹${metric.coverageRatio.toFixed(2)}`
                        : 'N/A'}
                    </td>
                    <td>
                      {metric.valueScore !== null ? (
                        <div className="value-score-bar">
                          <div
                            className="value-score-fill"
                            style={{ width: `${metric.valueScore}%` }}
                          />
                          <span>{metric.valueScore}/100</span>
                        </div>
                      ) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="value-metrics-note">
            * Premium per ₹1L shows how much premium you pay for every ₹1 lakh of coverage (lower is better)
          </p>
        </div>
      )}
    </div>
  );
}
