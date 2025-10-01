/**
 * Script to enhance processed RFQ question JSON files
 *
 * Enhancements:
 * 1. Convert sum_insured and turnover dropdowns to number inputs with Indian comma formatting
 * 2. Add "Other" option text fields for business type dropdowns
 * 3. Add currency formatting helper for rupee fields
 * 4. Mark fields for auto-fill from company profile
 * 5. Mark fields extractable from policy document upload
 */

const fs = require('fs');
const path = require('path');

const PROCESSED_DIR = path.join(__dirname, '../Resources/processed-rfq-questions');

// Fields that should use Indian currency formatting (lakhs/crores)
const CURRENCY_FIELDS = [
  'sum_insured',
  'sum_assured',
  'coverage_amount',
  'insured_value',
  'limit',
  'annual_turnover',
  'turnover',
  'revenue',
  'annual_revenue',
  'claim_amount',
  'salary',
  'wage',
  'premium',
  'deductible',
  'building_value',
  'content_value',
  'stock_value',
  'machinery_value',
  'annual_wages',
  'contract_value'
];

// Fields that can be auto-filled from company profile
const COMPANY_PROFILE_FIELDS = [
  'company_name',
  'business_name',
  'organization_name',
  'gst_number',
  'gstin',
  'pan_number',
  'pan',
  'registered_address',
  'address',
  'city',
  'state',
  'pincode',
  'pin_code',
  'postal_code',
  'email',
  'contact_email',
  'phone',
  'mobile',
  'contact_number',
  'website',
  'industry',
  'industry_type',
  'nature_of_business',
  'business_type',
  'annual_turnover',
  'employee_count',
  'number_of_employees'
];

// Fields that can be extracted from policy document upload
const POLICY_EXTRACTABLE_FIELDS = [
  'sum_insured',
  'sum_assured',
  'coverage_amount',
  'policy_period',
  'policy_start_date',
  'policy_end_date',
  'coverage_type',
  'deductible',
  'premium',
  'previous_insurer',
  'policy_number',
  'claim_history',
  'coverage_details',
  'add_on_covers',
  'exclusions',
  'building_value',
  'content_value',
  'stock_value'
];

// Business type fields that should have "Other" option with text input
const BUSINESS_TYPE_FIELDS = [
  'nature_of_business',
  'business_type',
  'industry',
  'industry_type',
  'type_of_manufacturing',
  'business_activity',
  'occupation'
];

function isCurrencyField(fieldName) {
  return CURRENCY_FIELDS.some(cf => fieldName.toLowerCase().includes(cf));
}

function isCompanyProfileField(fieldName) {
  return COMPANY_PROFILE_FIELDS.some(cpf =>
    fieldName.toLowerCase().includes(cpf) ||
    fieldName.toLowerCase() === cpf
  );
}

function isPolicyExtractableField(fieldName) {
  return POLICY_EXTRACTABLE_FIELDS.some(pef =>
    fieldName.toLowerCase().includes(pef)
  );
}

function isBusinessTypeField(fieldName) {
  return BUSINESS_TYPE_FIELDS.some(btf =>
    fieldName.toLowerCase().includes(btf)
  );
}

function enhanceQuestion(question) {
  const enhanced = { ...question };

  // 1. Convert currency dropdowns to number inputs with formatting
  if (isCurrencyField(question.field_name)) {
    if (question.field_type === 'select' || question.field_type === 'multiselect') {
      enhanced.field_type = 'number';
      enhanced.format = 'indian_currency'; // Enable Indian comma formatting
      delete enhanced.options; // Remove dropdown options

      // Update validation for large amounts
      enhanced.validation_rules = {
        ...enhanced.validation_rules,
        required: enhanced.validation_rules?.required ?? true,
        min: 0,
        max: 100000000000 // 1000 crores
      };

      // Update guidance to mention format
      if (!enhanced.guidance_text.includes('lakh') && !enhanced.guidance_text.includes('crore')) {
        enhanced.guidance_text += ' You can enter the amount in lakhs or crores (e.g., 50,00,000 or 5,00,00,000).';
      }
    }
  }

  // 2. Add "Other" option handling for business type fields
  if (isBusinessTypeField(question.field_name) &&
      (question.field_type === 'select' || question.field_type === 'radio')) {

    // Ensure "Other" is in options
    if (enhanced.options && !enhanced.options.some(opt =>
        opt.toLowerCase().includes('other') || opt.toLowerCase().includes('specify'))) {
      enhanced.options.push('Other (Please specify)');
    }

    // Add conditional follow-up field
    enhanced.has_other_option = true;
    enhanced.other_field = {
      field_name: `${question.field_name}_other`,
      field_type: 'text',
      placeholder: 'Please specify your business type',
      validation_rules: {
        required: false, // Only required if "Other" is selected
        maxLength: 200
      },
      conditional_logic: {
        show_if: {
          field: question.field_name,
          value: 'Other (Please specify)'
        }
      }
    };
  }

  // 3. Mark fields for auto-fill from company profile
  if (isCompanyProfileField(question.field_name)) {
    enhanced.auto_fill_source = 'company_profile';
    enhanced.auto_fill_enabled = true;
  }

  // 4. Mark fields extractable from policy document
  if (isPolicyExtractableField(question.field_name)) {
    enhanced.policy_extractable = true;
    enhanced.extraction_priority = 'high'; // AI should try to extract this
  }

  // 5. Add Indian number formatting for all number fields
  if (enhanced.field_type === 'number' && !enhanced.format) {
    // Check if it's a count (employees, vehicles, etc.) or amount
    if (isCurrencyField(question.field_name)) {
      enhanced.format = 'indian_currency';
    } else if (question.field_name.includes('count') ||
               question.field_name.includes('number_of') ||
               question.field_name.includes('quantity')) {
      enhanced.format = 'integer';
    } else {
      enhanced.format = 'decimal';
    }
  }

  return enhanced;
}

function processFile(filename) {
  const filePath = path.join(PROCESSED_DIR, filename);

  console.log(`Processing: ${filename}`);

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Enhance each question
    data.questions = data.questions.map(enhanceQuestion);

    // Add metadata about enhancements
    data.enhanced_features = {
      version: '2.0',
      features: [
        'indian_currency_formatting',
        'auto_fill_from_company_profile',
        'policy_document_extraction',
        'other_option_text_fields',
        'smart_field_types'
      ],
      last_enhanced: new Date().toISOString()
    };

    // Add policy upload configuration
    data.supports_policy_upload = true;
    data.extractable_fields_count = data.questions.filter(q => q.policy_extractable).length;

    // Write back enhanced file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`✓ Enhanced ${filename} - ${data.questions.length} questions processed`);

    return {
      filename,
      total_questions: data.questions.length,
      currency_fields: data.questions.filter(q => q.format === 'indian_currency').length,
      auto_fill_fields: data.questions.filter(q => q.auto_fill_enabled).length,
      extractable_fields: data.questions.filter(q => q.policy_extractable).length,
      other_option_fields: data.questions.filter(q => q.has_other_option).length
    };

  } catch (error) {
    console.error(`✗ Error processing ${filename}:`, error.message);
    return null;
  }
}

function main() {
  console.log('=== Enhancing RFQ Question Files ===\n');

  if (!fs.existsSync(PROCESSED_DIR)) {
    console.error(`Directory not found: ${PROCESSED_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(PROCESSED_DIR).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.log('No JSON files found to process.');
    process.exit(0);
  }

  console.log(`Found ${files.length} files to process\n`);

  const results = files.map(processFile).filter(r => r !== null);

  console.log('\n=== Enhancement Summary ===\n');

  const totals = results.reduce((acc, r) => ({
    questions: acc.questions + r.total_questions,
    currency: acc.currency + r.currency_fields,
    autoFill: acc.autoFill + r.auto_fill_fields,
    extractable: acc.extractable + r.extractable_fields,
    otherOptions: acc.otherOptions + r.other_option_fields
  }), { questions: 0, currency: 0, autoFill: 0, extractable: 0, otherOptions: 0 });

  console.log(`Files processed: ${results.length}`);
  console.log(`Total questions: ${totals.questions}`);
  console.log(`Currency fields with Indian formatting: ${totals.currency}`);
  console.log(`Auto-fill fields from company profile: ${totals.autoFill}`);
  console.log(`Policy extractable fields: ${totals.extractable}`);
  console.log(`Business type fields with "Other" option: ${totals.otherOptions}`);

  console.log('\n✓ All files enhanced successfully!');
}

// Run the script
main();
