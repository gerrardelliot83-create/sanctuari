/**
 * Reload All Products and Questions from JSON Files
 *
 * This script is run AFTER migration 012_reset_products_and_questions.sql
 *
 * It will:
 * 1. Load all 45 products from JSON files (using internal product_name)
 * 2. Load all questions for each product
 * 3. (Optional) Delete existing user RFQs for clean start
 *    OR attempt to map them to new product IDs
 * 4. Re-enable the foreign key constraint on rfqs.product_id
 *
 * Usage:
 *   node scripts/reload-all-products.js           (keeps existing RFQs)
 *   node scripts/reload-all-products.js --clean   (deletes existing RFQs)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://trjutifvugvnfsxbelns.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyanV0aWZ2dWd2bmZzeGJlbG5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTMxODU5NCwiZXhwIjoyMDc0ODk0NTk0fQ.yyUCgvVZ3YHT-uP2icaN5NSiptqynEbCm3vZ9DYq0Vc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const PROCESSED_DIR = path.join(__dirname, '../Resources/processed-rfq-questions');

async function main() {
  console.log('=== Reloading All Products and Questions ===\n');
  console.log(`Supabase URL: ${SUPABASE_URL}\n`);

  // Check if --clean flag is provided
  const cleanStart = process.argv.includes('--clean');

  if (!fs.existsSync(PROCESSED_DIR)) {
    console.error(`❌ Directory not found: ${PROCESSED_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(PROCESSED_DIR).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.error('❌ No JSON files found to process.');
    process.exit(1);
  }

  console.log(`Found ${files.length} JSON files to process\n`);

  // Step 1: Handle existing RFQs
  console.log('Step 1: Checking for existing user RFQs...');
  const { data: existingRfqs, error: rfqError } = await supabase
    .from('rfqs')
    .select('id, product_id, title, status');

  if (rfqError) {
    console.error('❌ Error fetching RFQs:', rfqError.message);
  } else {
    const rfqCount = existingRfqs?.length || 0;
    console.log(`  Found ${rfqCount} existing RFQs\n`);

    if (rfqCount > 0) {
      if (cleanStart) {
        console.log('  🗑️  --clean flag detected: Deleting all existing RFQs...');

        // Delete RFQ responses first (foreign key)
        await supabase.from('rfq_responses').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // Delete RFQs
        const { error: deleteError } = await supabase
          .from('rfqs')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (deleteError) {
          console.error('  ❌ Error deleting RFQs:', deleteError.message);
        } else {
          console.log(`  ✓ Deleted all ${rfqCount} RFQs and their responses\n`);
        }
      } else {
        console.log('  ⚠️  Keeping existing RFQs (they will need product_id updates)');
        console.log('  💡 To delete RFQs and start fresh, run with: --clean flag\n');
      }
    }
  }

  // Step 2: Load all products and questions from JSON files
  console.log('Step 2: Loading products and questions from JSON files...\n');

  const productMapping = {}; // Maps product_name -> new product_id
  let totalProducts = 0;
  let totalQuestions = 0;

  for (const file of files) {
    const filePath = path.join(PROCESSED_DIR, file);
    console.log(`Processing: ${file}`);

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(fileContent);

      // Create product
      const { data: newProduct, error: productError } = await supabase
        .from('insurance_products')
        .insert({
          name: data.product_name,
          category: data.product_category,
          is_active: true
        })
        .select('id')
        .single();

      if (productError) {
        console.error(`  ❌ Error creating product: ${productError.message}`);
        continue;
      }

      const productId = newProduct.id;
      productMapping[data.product_name] = productId;

      console.log(`  ✓ Created product: ${data.product_name}`);
      console.log(`    Product ID: ${productId}`);

      // Prepare questions for insertion
      const questionsToInsert = data.questions.map((q, index) => ({
        product_id: productId,
        question_text: q.question_text,
        field_type: q.field_type,
        field_name: q.field_name,
        options: q.options || null,
        validation_rules: q.validation_rules || null,
        guidance_text: q.guidance_text || null,
        placeholder: q.placeholder || null,
        conditional_logic: q.conditional_logic || null,
        section: q.section || 'General',
        order_index: q.order_index || index + 1,
        metadata: {
          format: q.format,
          auto_fill_source: q.auto_fill_source,
          auto_fill_enabled: q.auto_fill_enabled,
          policy_extractable: q.policy_extractable,
          extraction_priority: q.extraction_priority,
          has_other_option: q.has_other_option,
          other_field: q.other_field
        }
      }));

      // Insert questions in batches
      const batchSize = 100;
      let insertedCount = 0;

      for (let i = 0; i < questionsToInsert.length; i += batchSize) {
        const batch = questionsToInsert.slice(i, i + batchSize);

        const { error: insertError } = await supabase
          .from('rfq_questions')
          .insert(batch);

        if (insertError) {
          console.error(`  ❌ Error inserting questions: ${insertError.message}`);
          break;
        }

        insertedCount += batch.length;
      }

      console.log(`  ✓ Inserted ${insertedCount} questions`);
      totalProducts++;
      totalQuestions += insertedCount;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`  ❌ Error processing ${file}: ${error.message}`);
    }

    console.log('');
  }

  console.log(`\n✓ Loaded ${totalProducts} products with ${totalQuestions} total questions\n`);

  // Step 3: Handle RFQs (if any remain)
  if (!cleanStart && existingRfqs && existingRfqs.length > 0) {
    console.log('Step 3: Checking RFQ status...\n');

    const { data: remainingRfqs } = await supabase
      .from('rfqs')
      .select('id, title, product_id, status');

    if (remainingRfqs && remainingRfqs.length > 0) {
      console.log(`  ⚠️  ${remainingRfqs.length} RFQs still exist with old product_ids`);
      console.log('  These RFQs will NOT work until product_ids are updated manually\n');
      console.log('  Option 1: Re-run with --clean flag to delete them');
      console.log('  Option 2: Update them manually in Supabase\n');
    }
  } else {
    console.log('Step 3: No RFQs to update (clean start)\n');
  }

  // Step 4: Re-enable foreign key constraint
  console.log('Step 4: Re-enabling foreign key constraint...\n');
  console.log('  Please run this in Supabase SQL Editor:\n');
  console.log('  ALTER TABLE rfqs');
  console.log('  ADD CONSTRAINT rfqs_product_id_fkey');
  console.log('  FOREIGN KEY (product_id)');
  console.log('  REFERENCES insurance_products(id);\n');

  // Final summary
  console.log('\n=== Reload Complete! ===\n');
  console.log(`✓ Products loaded: ${totalProducts}`);
  console.log(`✓ Questions loaded: ${totalQuestions}`);
  console.log(`✓ Average questions per product: ${Math.round(totalQuestions / totalProducts)}`);
  console.log('\nNext steps:');
  console.log('1. Run: node scripts/diagnose-product-issues.js');
  console.log('2. Manually update RFQ product_ids if needed');
  console.log('3. Test RFQ creation at /rfq/create\n');
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
