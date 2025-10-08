/**
 * Enhanced Quote Comparison Engine
 * Provides product-aware quote comparison with semantic field matching
 */

import {
  getProductSchema,
  getProductCategory,
  FIELD_ALIASES,
  FIELD_TYPES
} from './product-schemas';

/**
 * QuoteComparisonEngine Class
 * Handles intelligent comparison of insurance quotes
 */
export class QuoteComparisonEngine {
  constructor(productName, quotes) {
    this.productName = productName;
    this.quotes = quotes;
    this.schema = getProductSchema(productName);
    this.category = getProductCategory(productName);
  }

  /**
   * Main comparison method
   * Returns structured comparison data
   */
  compare() {
    if (!this.schema) {
      return this.basicComparison();
    }

    // Extract and normalize fields from all quotes
    const normalizedQuotes = this.quotes.map(quote => this.normalizeQuote(quote));

    // Generate comparison matrix
    const comparisonMatrix = this.generateComparisonMatrix(normalizedQuotes);

    // Calculate value metrics
    const valueMetrics = this.calculateValueMetrics(normalizedQuotes);

    // Identify best quotes by category
    const bestQuotes = this.identifyBestQuotes(normalizedQuotes);

    // Generate insights
    const insights = this.generateInsights(normalizedQuotes, valueMetrics);

    return {
      productName: this.productName,
      category: this.category,
      quotesCompared: this.quotes.length,
      comparisonMatrix,
      valueMetrics,
      bestQuotes,
      insights,
      normalizedQuotes
    };
  }

  /**
   * Normalize a quote based on product schema
   * Extracts and standardizes fields
   */
  normalizeQuote(quote) {
    const normalized = {
      quoteId: quote.id,
      insurerName: quote.insurer_name || quote.bidder_company_name,
      rawData: quote,
      fields: {}
    };

    // Extract each key field from schema
    this.schema.keyFields.forEach(fieldDef => {
      const value = this.extractField(quote, fieldDef);
      normalized.fields[fieldDef.name] = {
        value,
        type: fieldDef.type,
        label: fieldDef.label,
        critical: fieldDef.critical,
        formatted: this.formatFieldValue(value, fieldDef.type)
      };
    });

    return normalized;
  }

  /**
   * Extract field value from quote using semantic matching
   */
  extractField(quote, fieldDef) {
    const fieldName = fieldDef.name;

    // 1. Try direct match from database fields
    if (quote[fieldName] !== undefined && quote[fieldName] !== null) {
      return quote[fieldName];
    }

    // 2. Try common variations
    const variations = [
      fieldName,
      fieldName.replace(/_/g, ''),
      fieldName.replace(/_/g, ' '),
      fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/_/g, ' ')
    ];

    for (const variation of variations) {
      if (quote[variation] !== undefined && quote[variation] !== null) {
        return quote[variation];
      }
    }

    // 3. Try aliases
    const aliases = FIELD_ALIASES[fieldName] || [];
    for (const alias of aliases) {
      if (quote[alias] !== undefined && quote[alias] !== null) {
        return quote[alias];
      }
    }

    // 4. Try from additional_terms (text parsing)
    if (quote.additional_terms) {
      const extracted = this.extractFromText(quote.additional_terms, fieldDef);
      if (extracted !== null) {
        return extracted;
      }
    }

    // 5. Try from parsed document data
    if (quote.bid_documents && quote.bid_documents.length > 0) {
      for (const doc of quote.bid_documents) {
        if (doc.parsed_data) {
          const extracted = this.extractFromParsedData(doc.parsed_data, fieldDef);
          if (extracted !== null) {
            return extracted;
          }
        }
      }
    }

    return null;
  }

  /**
   * Extract field value from text using pattern matching
   */
  extractFromText(text, fieldDef) {
    if (!text || typeof text !== 'string') return null;

    const lowerText = text.toLowerCase();
    const aliases = FIELD_ALIASES[fieldDef.name] || [fieldDef.label.toLowerCase()];

    // Try to find field mentions
    for (const alias of aliases) {
      const index = lowerText.indexOf(alias.toLowerCase());
      if (index !== -1) {
        // Extract value after field name
        const afterField = text.substring(index + alias.length, index + alias.length + 100);

        // Try to extract based on field type
        if (fieldDef.type === FIELD_TYPES.CURRENCY) {
          const match = afterField.match(/[₹$]?\s*([\d,]+(?:\.\d{2})?)/);
          if (match) return parseFloat(match[1].replace(/,/g, ''));
        } else if (fieldDef.type === FIELD_TYPES.NUMBER) {
          const match = afterField.match(/(\d+)/);
          if (match) return parseInt(match[1]);
        } else if (fieldDef.type === FIELD_TYPES.PERCENTAGE) {
          const match = afterField.match(/([\d.]+)%?/);
          if (match) return parseFloat(match[1]);
        }
      }
    }

    return null;
  }

  /**
   * Extract field from parsed document data
   */
  extractFromParsedData(parsedData, fieldDef) {
    if (!parsedData || typeof parsedData !== 'object') return null;

    // Try direct key match
    if (parsedData[fieldDef.name] !== undefined) {
      return parsedData[fieldDef.name];
    }

    // Try aliases
    const aliases = FIELD_ALIASES[fieldDef.name] || [];
    for (const alias of aliases) {
      if (parsedData[alias] !== undefined) {
        return parsedData[alias];
      }
    }

    return null;
  }

  /**
   * Format field value for display
   */
  formatFieldValue(value, type) {
    if (value === null || value === undefined) return 'Not Specified';

    switch (type) {
      case FIELD_TYPES.CURRENCY:
        return `₹${parseFloat(value).toLocaleString('en-IN')}`;

      case FIELD_TYPES.PERCENTAGE:
        return `${parseFloat(value).toFixed(2)}%`;

      case FIELD_TYPES.NUMBER:
        return parseInt(value).toLocaleString('en-IN');

      case FIELD_TYPES.BOOLEAN:
        return value ? 'Yes' : 'No';

      case FIELD_TYPES.LIST:
        return Array.isArray(value) ? value.join(', ') : value;

      case FIELD_TYPES.DATE:
        return new Date(value).toLocaleDateString('en-IN');

      case FIELD_TYPES.TEXT:
      default:
        return String(value);
    }
  }

  /**
   * Generate comparison matrix
   * Creates table structure for side-by-side comparison
   */
  generateComparisonMatrix(normalizedQuotes) {
    const matrix = {
      headers: ['Field', ...normalizedQuotes.map(q => q.insurerName)],
      rows: []
    };

    // Add row for each field in schema
    this.schema.keyFields.forEach(fieldDef => {
      const row = {
        field: fieldDef.label,
        fieldName: fieldDef.name,
        type: fieldDef.type,
        critical: fieldDef.critical,
        values: normalizedQuotes.map(quote => {
          const field = quote.fields[fieldDef.name];
          return {
            raw: field.value,
            formatted: field.formatted,
            quoteId: quote.quoteId
          };
        })
      };

      // Add comparison indicators (best/worst)
      if (fieldDef.type === FIELD_TYPES.CURRENCY && fieldDef.name === 'premium') {
        row.bestIndex = this.findLowestIndex(row.values.map(v => v.raw));
      } else if (fieldDef.type === FIELD_TYPES.CURRENCY && fieldDef.name === 'sum_insured') {
        row.bestIndex = this.findHighestIndex(row.values.map(v => v.raw));
      }

      matrix.rows.push(row);
    });

    return matrix;
  }

  /**
   * Calculate value metrics for each quote
   */
  calculateValueMetrics(normalizedQuotes) {
    return normalizedQuotes.map(quote => {
      const premium = quote.fields.premium?.value;
      const sumInsured = quote.fields.sum_insured?.value;

      const metrics = {
        quoteId: quote.quoteId,
        insurerName: quote.insurerName,
        premium,
        sumInsured,
        premiumEfficiency: null,
        coverageRatio: null,
        valueScore: null
      };

      // Calculate premium efficiency (premium per lakh of coverage)
      if (premium && sumInsured && sumInsured > 0) {
        metrics.premiumEfficiency = (premium / sumInsured) * 100000;
      }

      // Calculate coverage ratio (how much coverage per rupee of premium)
      if (premium && sumInsured && premium > 0) {
        metrics.coverageRatio = sumInsured / premium;
      }

      // Calculate value score (0-100)
      // Lower premium efficiency = better value
      if (metrics.premiumEfficiency) {
        const allEfficiencies = normalizedQuotes
          .map(q => {
            const p = q.fields.premium?.value;
            const s = q.fields.sum_insured?.value;
            return (p && s && s > 0) ? (p / s) * 100000 : null;
          })
          .filter(e => e !== null);

        if (allEfficiencies.length > 0) {
          const minEfficiency = Math.min(...allEfficiencies);
          const maxEfficiency = Math.max(...allEfficiencies);

          if (maxEfficiency > minEfficiency) {
            // Invert: lower efficiency = higher score
            metrics.valueScore = Math.round(
              ((maxEfficiency - metrics.premiumEfficiency) / (maxEfficiency - minEfficiency)) * 100
            );
          } else {
            metrics.valueScore = 100;
          }
        }
      }

      return metrics;
    });
  }

  /**
   * Identify best quotes by different criteria
   */
  identifyBestQuotes(normalizedQuotes) {
    const best = {
      lowestPremium: null,
      highestCoverage: null,
      bestValue: null,
      mostComprehensive: null
    };

    // Lowest premium
    const premiums = normalizedQuotes.map((q, idx) => ({
      idx,
      value: q.fields.premium?.value,
      quote: q
    })).filter(p => p.value !== null);

    if (premiums.length > 0) {
      const lowest = premiums.reduce((min, p) => p.value < min.value ? p : min);
      best.lowestPremium = {
        quoteId: lowest.quote.quoteId,
        insurerName: lowest.quote.insurerName,
        value: lowest.value,
        formatted: lowest.quote.fields.premium.formatted
      };
    }

    // Highest coverage
    const coverages = normalizedQuotes.map((q, idx) => ({
      idx,
      value: q.fields.sum_insured?.value,
      quote: q
    })).filter(c => c.value !== null);

    if (coverages.length > 0) {
      const highest = coverages.reduce((max, c) => c.value > max.value ? c : max);
      best.highestCoverage = {
        quoteId: highest.quote.quoteId,
        insurerName: highest.quote.insurerName,
        value: highest.value,
        formatted: highest.quote.fields.sum_insured.formatted
      };
    }

    // Best value (lowest premium efficiency)
    const valueMetrics = this.calculateValueMetrics(normalizedQuotes);
    const validMetrics = valueMetrics.filter(m => m.premiumEfficiency !== null);

    if (validMetrics.length > 0) {
      const bestValueMetric = validMetrics.reduce((best, m) =>
        m.premiumEfficiency < best.premiumEfficiency ? m : best
      );
      best.bestValue = {
        quoteId: bestValueMetric.quoteId,
        insurerName: bestValueMetric.insurerName,
        premiumEfficiency: bestValueMetric.premiumEfficiency,
        valueScore: bestValueMetric.valueScore
      };
    }

    // Most comprehensive (most fields filled)
    const comprehensiveness = normalizedQuotes.map(quote => {
      const filledFields = Object.values(quote.fields)
        .filter(f => f.value !== null && f.value !== undefined).length;
      return {
        quote,
        filledFields,
        totalFields: this.schema.keyFields.length
      };
    });

    const mostComp = comprehensiveness.reduce((max, c) =>
      c.filledFields > max.filledFields ? c : max
    );
    best.mostComprehensive = {
      quoteId: mostComp.quote.quoteId,
      insurerName: mostComp.quote.insurerName,
      filledFields: mostComp.filledFields,
      totalFields: mostComp.totalFields
    };

    return best;
  }

  /**
   * Generate comparative insights
   */
  generateInsights(normalizedQuotes, valueMetrics) {
    const insights = [];

    // Premium range
    const premiums = normalizedQuotes
      .map(q => q.fields.premium?.value)
      .filter(p => p !== null);

    if (premiums.length > 1) {
      const minPremium = Math.min(...premiums);
      const maxPremium = Math.max(...premiums);
      const avgPremium = premiums.reduce((a, b) => a + b, 0) / premiums.length;
      const spread = ((maxPremium - minPremium) / avgPremium * 100).toFixed(1);

      insights.push({
        type: 'premium_spread',
        title: 'Premium Variation',
        message: `Premiums vary by ${spread}% (₹${minPremium.toLocaleString('en-IN')} to ₹${maxPremium.toLocaleString('en-IN')})`,
        severity: spread > 30 ? 'high' : spread > 15 ? 'medium' : 'low'
      });
    }

    // Coverage gaps
    const criticalFields = this.schema.keyFields.filter(f => f.critical);
    const missingCriticalFields = criticalFields.filter(field => {
      const allNull = normalizedQuotes.every(q => q.fields[field.name]?.value === null);
      return allNull;
    });

    if (missingCriticalFields.length > 0) {
      insights.push({
        type: 'missing_data',
        title: 'Missing Critical Information',
        message: `None of the quotes specify: ${missingCriticalFields.map(f => f.label).join(', ')}`,
        severity: 'high'
      });
    }

    // Value variation
    const validMetrics = valueMetrics.filter(m => m.valueScore !== null);
    if (validMetrics.length > 1) {
      const scores = validMetrics.map(m => m.valueScore);
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      const diff = maxScore - minScore;

      if (diff > 30) {
        insights.push({
          type: 'value_gap',
          title: 'Significant Value Difference',
          message: `There's a ${diff.toFixed(0)}% difference in value between best and worst quotes`,
          severity: 'medium'
        });
      }
    }

    return insights;
  }

  /**
   * Basic comparison when schema not available
   */
  basicComparison() {
    return {
      productName: this.productName,
      category: null,
      quotesCompared: this.quotes.length,
      comparisonMatrix: {
        headers: ['Field', ...this.quotes.map(q => q.insurer_name || q.bidder_company_name)],
        rows: [
          {
            field: 'Premium',
            values: this.quotes.map(q => ({
              raw: q.premium_amount,
              formatted: q.premium_amount ? `₹${q.premium_amount.toLocaleString('en-IN')}` : 'N/A'
            }))
          },
          {
            field: 'Coverage Amount',
            values: this.quotes.map(q => ({
              raw: q.coverage_amount,
              formatted: q.coverage_amount ? `₹${q.coverage_amount.toLocaleString('en-IN')}` : 'N/A'
            }))
          },
          {
            field: 'Deductible',
            values: this.quotes.map(q => ({
              raw: q.deductible,
              formatted: q.deductible ? `₹${q.deductible.toLocaleString('en-IN')}` : 'N/A'
            }))
          }
        ]
      },
      insights: [{
        type: 'basic_comparison',
        title: 'Basic Comparison Only',
        message: `Detailed comparison not available for ${this.productName}. Showing basic fields only.`,
        severity: 'low'
      }]
    };
  }

  /**
   * Utility: Find index of lowest value
   */
  findLowestIndex(values) {
    const validValues = values.map((v, idx) => ({ v, idx })).filter(item => item.v !== null);
    if (validValues.length === 0) return null;

    const lowest = validValues.reduce((min, item) => item.v < min.v ? item : min);
    return lowest.idx;
  }

  /**
   * Utility: Find index of highest value
   */
  findHighestIndex(values) {
    const validValues = values.map((v, idx) => ({ v, idx })).filter(item => item.v !== null);
    if (validValues.length === 0) return null;

    const highest = validValues.reduce((max, item) => item.v > max.v ? item : max);
    return highest.idx;
  }
}

/**
 * Helper function to create and run comparison
 */
export function compareQuotes(productName, quotes) {
  const engine = new QuoteComparisonEngine(productName, quotes);
  return engine.compare();
}
