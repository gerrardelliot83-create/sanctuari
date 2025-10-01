/**
 * Load Enhanced RFQ Questions into Supabase
 *
 * This script:
 * 1. Reads all enhanced JSON files
 * 2. Maps products to their database IDs
 * 3. Inserts questions into rfq_questions table
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://trjutifvugvnfsxbelns.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyanV0aWZ2dWd2bmZzeGJlbG5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTMxODU5NCwiZXhwIjoyMDc0ODk0NTk0fQ.yyUCgvVZ3YHT-uP2icaN5NSiptqynEbCm3vZ9DYq0Vc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const PROCESSED_DIR = path.join(__dirname, '../Resources/processed-rfq-questions');

// Product name mapping (JSON file name → Database product name)
const PRODUCT_MAPPING = {
  'baggage_insurance_json': 'Baggage Insurance',
  'boiler_pressure_plant_json': 'Boiler and Pressure Plant Insurance',
  'burglary_insurance_json': 'Burglary Insurance',
  'business_interruption_insurance_json': 'Business Interruption Insurance',
  'business_package_insurance_json': 'Business Package Insurance',
  'car_insurance_json': 'Motor Insurance',
  'carriers_liability_json': 'Carriers Legal Liability Insurance',
  'cgl_insurance_json': 'Commercial General Liability',
  'cpm_insurance_json': 'Contractors Plant and Machinery Insurance',
  'cyber_liability_json': 'Cyber Liability Insurance',
  'delay_in_startup_insurance_json': 'Delay in Start-Up Insurance',
  'directors_officers_liability_json': 'Directors & Officers Liability Insurance',
  'electronic_equipment_insurance_json': 'Electronic Equipment Insurance',
  'emp_comp_insurance_json': 'Employees Compensation Insurance',
  'erection_risk_insurance_json': 'Erection All Risk Insurance',
  'fidelity_insurance_json': 'Fidelity Guarantee Insurance',
  'fire_loss_of_profit_insurance': 'Fire Loss of Profit Insurance',
  'freight_insurance': 'Freight Insurance',
  'group_health_insurance': 'Group Health Insurance',
  'group_personal_accident_insurance': 'Group Personal Accident Insurance',
  'group_term_life_insurance': 'Group Term Life Insurance',
  'hull_and_machinery_insurance': 'Hull and Machinery Insurance',
  'industrial_all_risk_json': 'Industrial All Risk Insurance',
  'livestock_insurance_json': 'Livestock/Cattle/Animal Insurance',
  'machinery_breakdown_json': 'Machinery Breakdown Insurance',
  'machinery_loss_profit_json': 'Machinery Loss of Profit Insurance',
  'marine_cargo_open_cover_json': 'Marine Cargo Open Cover Insurance',
  'marine_transit_json': 'Marine Transit Insurance',
  'money_insurance_json': 'Money Insurance',
  'pi_general_insurance_json': 'Professional Indemnity Insurance',
  'pi_it_insurance_json': 'Professional Indemnity - IT Insurance',
  'pl_industrial_insurance_json': 'Public Liability - Industrial Insurance',
  'plate_glass_json': 'Plate Glass Insurance',
  'pollution_liability_json': 'Pollution Legal Liability Insurance',
  'public_liability_non_industrial_json': 'Public Liability - Non Industrial Insurance',
  'public_offering_securities_json': 'Public Offering of Securities Insurance',
  'shopkeeper_marine_insurance_json': 'Shopkeeper Marine Insurance',
  'shopkeepers_insurance_json': 'Shopkeepers Insurance',
  'signage_insurance_json': 'Signage Insurance',
  'standard_fire_special_perils_insurance': 'Fire and Special Perils Insurance',
  'stop_insurance_json': 'STOP Insurance (Sales Turnover)',
  'surety_insurance_json': 'Surety Insurance',
  'title_insurance_json': 'Title Insurance - Commercial',
  'trade_credit_json': 'Trade Credit Insurance',
  'workmens_compensation_json': 'Workmen\'s Compensation Insurance'
};

async function getOrCreateProduct(productName, category) {
  // First, try to find existing product
  const { data: existingProduct, error: findError } = await supabase
    .from('insurance_products')
    .select('id')
    .eq('name', productName)
    .single();

  if (existingProduct) {
    console.log(`  ✓ Found existing product: ${productName}`);
    return existingProduct.id;
  }

  // If not found, create it
  const { data: newProduct, error: createError } = await supabase
    .from('insurance_products')
    .insert({
      name: productName,
      category: category,
      is_active: true
    })
    .select('id')
    .single();

  if (createError) {
    console.error(`  ✗ Error creating product ${productName}:`, createError.message);
    throw createError;
  }

  console.log(`  ✓ Created new product: ${productName}`);
  return newProduct.id;
}

async function loadQuestionsFromFile(filename) {
  const filePath = path.join(PROCESSED_DIR, filename);

  console.log(`\nProcessing: ${filename}`);

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    // Get product ID (create if doesn't exist)
    const productId = await getOrCreateProduct(data.product_name, data.product_category);

    // Check if questions already exist for this product
    const { data: existingQuestions, error: checkError } = await supabase
      .from('rfq_questions')
      .select('id')
      .eq('product_id', productId)
      .limit(1);

    if (existingQuestions && existingQuestions.length > 0) {
      console.log(`  ⚠ Questions already exist for ${data.product_name}, skipping...`);
      return { skipped: true, product: data.product_name };
    }

    // Prepare questions for insertion
    const questionsToInsert = data.questions.map((q, index) => ({
      product_id: productId,
      question_text: q.question_text,
      field_type: q.field_type,
      field_name: q.field_name,
      options: q.options ? JSON.stringify(q.options) : null,
      validation_rules: q.validation_rules ? JSON.stringify(q.validation_rules) : null,
      guidance_text: q.guidance_text || null,
      placeholder: q.placeholder || null,
      conditional_logic: q.conditional_logic ? JSON.stringify(q.conditional_logic) : null,
      section: q.section || 'General',
      order_index: q.order_index || index + 1,
      // Store enhancement metadata
      metadata: JSON.stringify({
        format: q.format,
        auto_fill_source: q.auto_fill_source,
        auto_fill_enabled: q.auto_fill_enabled,
        policy_extractable: q.policy_extractable,
        extraction_priority: q.extraction_priority,
        has_other_option: q.has_other_option,
        other_field: q.other_field
      })
    }));

    // Insert questions in batches of 100
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < questionsToInsert.length; i += batchSize) {
      const batch = questionsToInsert.slice(i, i + batchSize);

      const { data: insertedData, error: insertError } = await supabase
        .from('rfq_questions')
        .insert(batch);

      if (insertError) {
        console.error(`  ✗ Error inserting questions:`, insertError.message);
        throw insertError;
      }

      insertedCount += batch.length;
    }

    console.log(`  ✓ Inserted ${insertedCount} questions for ${data.product_name}`);

    return {
      product: data.product_name,
      category: data.product_category,
      questionCount: insertedCount,
      currencyFields: data.questions.filter(q => q.format === 'indian_currency').length,
      autoFillFields: data.questions.filter(q => q.auto_fill_enabled).length,
      extractableFields: data.questions.filter(q => q.policy_extractable).length
    };

  } catch (error) {
    console.error(`  ✗ Error processing ${filename}:`, error.message);
    return { error: true, filename, message: error.message };
  }
}

async function main() {
  console.log('=== Loading RFQ Questions into Supabase ===\n');
  console.log(`Supabase URL: ${SUPABASE_URL}\n`);

  if (!fs.existsSync(PROCESSED_DIR)) {
    console.error(`Directory not found: ${PROCESSED_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(PROCESSED_DIR).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.log('No JSON files found to process.');
    process.exit(0);
  }

  console.log(`Found ${files.length} files to load\n`);

  const results = [];

  for (const file of files) {
    const result = await loadQuestionsFromFile(file);
    results.push(result);

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n=== Loading Summary ===\n');

  const successful = results.filter(r => !r.error && !r.skipped);
  const skipped = results.filter(r => r.skipped);
  const failed = results.filter(r => r.error);

  console.log(`Successfully loaded: ${successful.length} products`);
  console.log(`Skipped (already exist): ${skipped.length} products`);
  console.log(`Failed: ${failed.length} products`);

  if (successful.length > 0) {
    const totals = successful.reduce((acc, r) => ({
      questions: acc.questions + r.questionCount,
      currency: acc.currency + r.currencyFields,
      autoFill: acc.autoFill + r.autoFillFields,
      extractable: acc.extractable + r.extractableFields
    }), { questions: 0, currency: 0, autoFill: 0, extractable: 0 });

    console.log(`\nTotal questions loaded: ${totals.questions}`);
    console.log(`Currency fields: ${totals.currency}`);
    console.log(`Auto-fill fields: ${totals.autoFill}`);
    console.log(`Extractable fields: ${totals.extractable}`);
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed files:');
    failed.forEach(f => console.log(`  - ${f.filename}: ${f.message}`));
  }

  console.log('\n✓ Loading complete!');
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
