/**
 * Product Schemas for Enhanced Quote Comparison
 * Maps insurance products to their key comparison fields
 * Handles semantic matching across different field names
 */

/**
 * Product Categories
 */
export const PRODUCT_CATEGORIES = {
  PROPERTY: 'property',
  LIABILITY: 'liability',
  MARINE: 'marine',
  HEALTH: 'health',
  LIFE: 'life',
  CYBER: 'cyber',
  PROJECT: 'project',
  PROFESSIONAL: 'professional'
};

/**
 * Field Types for Comparison
 */
export const FIELD_TYPES = {
  CURRENCY: 'currency',
  PERCENTAGE: 'percentage',
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  BOOLEAN: 'boolean',
  LIST: 'list'
};

/**
 * Common field aliases (semantic matching)
 * Maps different ways insurers might name the same field
 */
export const FIELD_ALIASES = {
  // Coverage Amount
  'sum_insured': ['sum insured', 'coverage amount', 'limit of indemnity', 'loi', 'coverage limit', 'insured amount'],

  // Premium
  'premium': ['premium amount', 'total premium', 'annual premium', 'premium (inclusive of taxes)', 'net premium'],

  // Deductible
  'deductible': ['excess', 'franchise', 'retention', 'out of pocket'],

  // Policy Period
  'policy_period': ['policy term', 'coverage period', 'insurance period', 'term'],

  // Territory
  'territory': ['geographical scope', 'coverage territory', 'jurisdiction', 'area of operation'],

  // Exclusions
  'exclusions': ['what is not covered', 'exceptions', 'policy exclusions', 'limitations'],

  // Add-ons
  'add_ons': ['additional coverages', 'optional covers', 'extended coverages', 'riders'],

  // Waiting Period
  'waiting_period': ['cooling period', 'pre-existing disease waiting', 'initial waiting'],

  // Sub-limits
  'sub_limits': ['inner limits', 'specific limits', 'per claim limits', 'itemized limits']
};

/**
 * Product Schema Definitions
 * Each product has:
 * - category: Product category
 * - keyFields: Most important fields for comparison
 * - fieldMappings: How to extract/normalize fields
 */
export const PRODUCT_SCHEMAS = {
  // ========================================
  // PROPERTY INSURANCE
  // ========================================

  'Fire and Special Perils Insurance': {
    category: PRODUCT_CATEGORIES.PROPERTY,
    keyFields: [
      { name: 'sum_insured', label: 'Sum Insured', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'premium', label: 'Premium', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'deductible', label: 'Deductible', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'perils_covered', label: 'Perils Covered', type: FIELD_TYPES.LIST, critical: true },
      { name: 'building_coverage', label: 'Building Coverage', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'contents_coverage', label: 'Contents Coverage', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'stock_coverage', label: 'Stock Coverage', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'machinery_coverage', label: 'Machinery Coverage', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'earthquake_cover', label: 'Earthquake Coverage', type: FIELD_TYPES.BOOLEAN, critical: false },
      { name: 'flood_cover', label: 'Flood Coverage', type: FIELD_TYPES.BOOLEAN, critical: false }
    ]
  },

  'Business Interruption Insurance': {
    category: PRODUCT_CATEGORIES.PROPERTY,
    keyFields: [
      { name: 'sum_insured', label: 'Sum Insured', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'premium', label: 'Premium', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'indemnity_period', label: 'Indemnity Period (months)', type: FIELD_TYPES.NUMBER, critical: true },
      { name: 'gross_profit_coverage', label: 'Gross Profit Coverage', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'increased_cost_coverage', label: 'Increased Cost of Working', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'waiting_period', label: 'Waiting Period (days)', type: FIELD_TYPES.NUMBER, critical: true }
    ]
  },

  'Machinery Breakdown Insurance': {
    category: PRODUCT_CATEGORIES.PROPERTY,
    keyFields: [
      { name: 'sum_insured', label: 'Sum Insured', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'premium', label: 'Premium', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'machinery_covered', label: 'Machinery Covered', type: FIELD_TYPES.LIST, critical: true },
      { name: 'deterioration_coverage', label: 'Deterioration of Stock', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'explosion_damage', label: 'Explosion Damage', type: FIELD_TYPES.BOOLEAN, critical: false },
      { name: 'own_surrounding_property', label: 'Own Surrounding Property Damage', type: FIELD_TYPES.CURRENCY, critical: false }
    ]
  },

  // ========================================
  // MARINE INSURANCE
  // ========================================

  'Marine Cargo Insurance': {
    category: PRODUCT_CATEGORIES.MARINE,
    keyFields: [
      { name: 'sum_insured', label: 'Sum Insured per Shipment', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'premium', label: 'Premium', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'coverage_type', label: 'Coverage Type', type: FIELD_TYPES.TEXT, critical: true }, // ICC A/B/C
      { name: 'territory', label: 'Geographical Coverage', type: FIELD_TYPES.TEXT, critical: true },
      { name: 'mode_of_transport', label: 'Mode of Transport', type: FIELD_TYPES.LIST, critical: true },
      { name: 'war_risk_coverage', label: 'War & SRCC Coverage', type: FIELD_TYPES.BOOLEAN, critical: false },
      { name: 'deductible', label: 'Deductible', type: FIELD_TYPES.CURRENCY, critical: false }
    ]
  },

  'Marine Transit Insurance': {
    category: PRODUCT_CATEGORIES.MARINE,
    keyFields: [
      { name: 'sum_insured', label: 'Sum Insured', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'premium', label: 'Premium', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'coverage_type', label: 'Coverage Type', type: FIELD_TYPES.TEXT, critical: true },
      { name: 'territory', label: 'Coverage Territory', type: FIELD_TYPES.TEXT, critical: true },
      { name: 'goods_covered', label: 'Goods Covered', type: FIELD_TYPES.LIST, critical: true },
      { name: 'deductible', label: 'Deductible', type: FIELD_TYPES.CURRENCY, critical: false }
    ]
  },

  // ========================================
  // HEALTH INSURANCE
  // ========================================

  'Group Health Insurance': {
    category: PRODUCT_CATEGORIES.HEALTH,
    keyFields: [
      { name: 'sum_insured', label: 'Sum Insured per Employee', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'premium', label: 'Premium per Employee', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'number_of_lives', label: 'Number of Lives Covered', type: FIELD_TYPES.NUMBER, critical: true },
      { name: 'room_rent_limit', label: 'Room Rent Limit', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'pre_existing_waiting', label: 'Pre-existing Disease Waiting (years)', type: FIELD_TYPES.NUMBER, critical: true },
      { name: 'maternity_coverage', label: 'Maternity Coverage', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'daycare_procedures', label: 'Daycare Procedures Covered', type: FIELD_TYPES.BOOLEAN, critical: false },
      { name: 'copay_percentage', label: 'Co-payment %', type: FIELD_TYPES.PERCENTAGE, critical: true },
      { name: 'restoration_benefit', label: 'Restoration Benefit', type: FIELD_TYPES.BOOLEAN, critical: false }
    ]
  },

  'Group Personal Accident Insurance': {
    category: PRODUCT_CATEGORIES.HEALTH,
    keyFields: [
      { name: 'sum_insured', label: 'Sum Insured per Person', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'premium', label: 'Premium per Person', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'number_of_lives', label: 'Number of Lives', type: FIELD_TYPES.NUMBER, critical: true },
      { name: 'accidental_death', label: 'Accidental Death Benefit', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'ptd_benefit', label: 'Permanent Total Disability', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'ppd_benefit', label: 'Permanent Partial Disability', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'ttd_benefit', label: 'Temporary Total Disability', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'medical_expenses', label: 'Medical Expenses Coverage', type: FIELD_TYPES.CURRENCY, critical: false }
    ]
  },

  // ========================================
  // LIFE INSURANCE
  // ========================================

  'Group Term Life Insurance': {
    category: PRODUCT_CATEGORIES.LIFE,
    keyFields: [
      { name: 'sum_insured', label: 'Sum Assured per Employee', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'premium', label: 'Premium per Employee', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'number_of_lives', label: 'Number of Lives', type: FIELD_TYPES.NUMBER, critical: true },
      { name: 'accidental_death_benefit', label: 'Accidental Death Benefit', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'disability_benefit', label: 'Disability Benefit', type: FIELD_TYPES.CURRENCY, critical: false }
    ]
  },

  // ========================================
  // LIABILITY INSURANCE
  // ========================================

  'Commercial General Liability': {
    category: PRODUCT_CATEGORIES.LIABILITY,
    keyFields: [
      { name: 'sum_insured', label: 'Limit of Indemnity', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'premium', label: 'Premium', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'bodily_injury_limit', label: 'Bodily Injury Limit', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'property_damage_limit', label: 'Property Damage Limit', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'per_occurrence_limit', label: 'Per Occurrence Limit', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'aggregate_limit', label: 'Annual Aggregate Limit', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'deductible', label: 'Deductible', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'territory', label: 'Geographical Coverage', type: FIELD_TYPES.TEXT, critical: true }
    ]
  },

  'Product Liability Insurance': {
    category: PRODUCT_CATEGORIES.LIABILITY,
    keyFields: [
      { name: 'sum_insured', label: 'Limit of Indemnity', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'premium', label: 'Premium', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'per_occurrence_limit', label: 'Per Occurrence Limit', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'aggregate_limit', label: 'Annual Aggregate Limit', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'products_covered', label: 'Products Covered', type: FIELD_TYPES.LIST, critical: true },
      { name: 'territory', label: 'Geographical Coverage', type: FIELD_TYPES.TEXT, critical: true },
      { name: 'recall_expenses', label: 'Product Recall Expenses', type: FIELD_TYPES.CURRENCY, critical: false }
    ]
  },

  "Workmen's Compensation Insurance": {
    category: PRODUCT_CATEGORIES.LIABILITY,
    keyFields: [
      { name: 'sum_insured', label: 'Total Wages', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'premium', label: 'Premium', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'number_of_employees', label: 'Number of Employees', type: FIELD_TYPES.NUMBER, critical: true },
      { name: 'statutory_limit', label: 'Statutory Limit', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'common_law_limit', label: 'Common Law Limit', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'medical_expenses_limit', label: 'Medical Expenses Limit', type: FIELD_TYPES.CURRENCY, critical: false }
    ]
  },

  // ========================================
  // PROFESSIONAL LIABILITY
  // ========================================

  'Professional Indemnity Insurance': {
    category: PRODUCT_CATEGORIES.PROFESSIONAL,
    keyFields: [
      { name: 'sum_insured', label: 'Limit of Indemnity', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'premium', label: 'Premium', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'per_claim_limit', label: 'Per Claim Limit', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'aggregate_limit', label: 'Annual Aggregate Limit', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'retroactive_date', label: 'Retroactive Date', type: FIELD_TYPES.DATE, critical: true },
      { name: 'deductible', label: 'Deductible', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'defense_costs', label: 'Defense Costs Coverage', type: FIELD_TYPES.TEXT, critical: true }, // within/outside limit
      { name: 'extended_reporting_period', label: 'Extended Reporting Period', type: FIELD_TYPES.TEXT, critical: false }
    ]
  },

  'Directors & Officers Liability Insurance': {
    category: PRODUCT_CATEGORIES.PROFESSIONAL,
    keyFields: [
      { name: 'sum_insured', label: 'Limit of Liability', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'premium', label: 'Premium', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'per_claim_limit', label: 'Per Claim Limit', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'aggregate_limit', label: 'Annual Aggregate Limit', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'deductible', label: 'Deductible', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'side_a_coverage', label: 'Side A (Non-indemnifiable)', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'side_b_coverage', label: 'Side B (Company Indemnification)', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'side_c_coverage', label: 'Side C (Entity Coverage)', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'investigation_costs', label: 'Investigation Costs', type: FIELD_TYPES.BOOLEAN, critical: false }
    ]
  },

  // ========================================
  // CYBER INSURANCE
  // ========================================

  'Cyber Liability Insurance': {
    category: PRODUCT_CATEGORIES.CYBER,
    keyFields: [
      { name: 'sum_insured', label: 'Limit of Liability', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'premium', label: 'Premium', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'data_breach_limit', label: 'Data Breach Response Limit', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'business_interruption_limit', label: 'Business Interruption Limit', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'cyber_extortion_limit', label: 'Cyber Extortion/Ransomware Limit', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'forensic_costs', label: 'Forensic Investigation Costs', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'notification_costs', label: 'Data Breach Notification Costs', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'credit_monitoring', label: 'Credit Monitoring for Affected Parties', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'deductible', label: 'Deductible', type: FIELD_TYPES.CURRENCY, critical: false },
      { name: 'waiting_period', label: 'Waiting Period (hours)', type: FIELD_TYPES.NUMBER, critical: true }
    ]
  },

  // ========================================
  // PROJECT INSURANCE
  // ========================================

  'Contractors All Risk': {
    category: PRODUCT_CATEGORIES.PROJECT,
    keyFields: [
      { name: 'sum_insured', label: 'Sum Insured', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'premium', label: 'Premium', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'contract_value', label: 'Contract Value', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'maintenance_period', label: 'Maintenance Period (months)', type: FIELD_TYPES.NUMBER, critical: true },
      { name: 'third_party_liability', label: 'Third Party Liability Limit', type: FIELD_TYPES.CURRENCY, critical: true },
      { name: 'earthquake_coverage', label: 'Earthquake Coverage', type: FIELD_TYPES.BOOLEAN, critical: false },
      { name: 'flood_coverage', label: 'Flood Coverage', type: FIELD_TYPES.BOOLEAN, critical: false },
      { name: 'deductible', label: 'Deductible', type: FIELD_TYPES.CURRENCY, critical: false }
    ]
  }
};

/**
 * Get schema for a product
 */
export function getProductSchema(productName) {
  return PRODUCT_SCHEMAS[productName] || null;
}

/**
 * Get category for a product
 */
export function getProductCategory(productName) {
  const schema = getProductSchema(productName);
  return schema ? schema.category : null;
}

/**
 * Get all products in a category
 */
export function getProductsByCategory(category) {
  return Object.entries(PRODUCT_SCHEMAS)
    .filter(([_, schema]) => schema.category === category)
    .map(([name, _]) => name);
}

/**
 * Check if field is critical for comparison
 */
export function isCriticalField(productName, fieldName) {
  const schema = getProductSchema(productName);
  if (!schema) return false;

  const field = schema.keyFields.find(f => f.name === fieldName);
  return field ? field.critical : false;
}
