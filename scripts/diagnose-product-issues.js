/**
 * Diagnostic Script: Product and Questions Analysis
 *
 * This script helps diagnose the product mismatch issue by showing:
 * 1. All products in the database
 * 2. Which products have questions
 * 3. Which products have RFQs
 * 4. Potential duplicates or mismatches
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://trjutifvugvnfsxbelns.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyanV0aWZ2dWd2bmZzeGJlbG5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTMxODU5NCwiZXhwIjoyMDc0ODk0NTk0fQ.yyUCgvVZ3YHT-uP2icaN5NSiptqynEbCm3vZ9DYq0Vc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function diagnose() {
  console.log('=== Product and Questions Diagnostic ===\n');
  console.log(`Supabase URL: ${SUPABASE_URL}\n`);

  // Get all products with their question counts and RFQ counts
  const { data: products, error } = await supabase
    .from('insurance_products')
    .select('id, name, category, is_active')
    .order('name');

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Total products in database: ${products.length}\n`);

  // Get question counts per product
  const { data: questionCounts } = await supabase
    .from('rfq_questions')
    .select('product_id');

  const questionCountMap = {};
  if (questionCounts) {
    questionCounts.forEach(q => {
      questionCountMap[q.product_id] = (questionCountMap[q.product_id] || 0) + 1;
    });
  }

  // Get RFQ counts per product
  const { data: rfqCounts } = await supabase
    .from('rfqs')
    .select('product_id');

  const rfqCountMap = {};
  if (rfqCounts) {
    rfqCounts.forEach(r => {
      rfqCountMap[r.product_id] = (rfqCountMap[r.product_id] || 0) + 1;
    });
  }

  // Analyze products
  const productsWithQuestions = [];
  const productsWithoutQuestions = [];
  const productsWithRFQs = [];
  const problematicProducts = [];

  products.forEach(product => {
    const questionCount = questionCountMap[product.id] || 0;
    const rfqCount = rfqCountMap[product.id] || 0;

    const productInfo = {
      ...product,
      questionCount,
      rfqCount
    };

    if (questionCount > 0) {
      productsWithQuestions.push(productInfo);
    } else {
      productsWithoutQuestions.push(productInfo);
    }

    if (rfqCount > 0) {
      productsWithRFQs.push(productInfo);
    }

    // Problematic: has RFQs but no questions
    if (rfqCount > 0 && questionCount === 0) {
      problematicProducts.push(productInfo);
    }
  });

  // Display results
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Products with questions: ${productsWithQuestions.length}`);
  console.log(`Products without questions: ${productsWithoutQuestions.length}`);
  console.log(`Products with RFQs: ${productsWithRFQs.length}`);
  console.log(`❌ PROBLEMATIC (RFQs but no questions): ${problematicProducts.length}`);
  console.log('');

  // Show products with questions
  console.log('\n✅ PRODUCTS WITH QUESTIONS');
  console.log('='.repeat(80));
  console.log(`${'Product Name'.padEnd(55)} ${'Category'.padEnd(12)} ${'Questions'.padEnd(10)} RFQs`);
  console.log('-'.repeat(80));
  productsWithQuestions.forEach(p => {
    console.log(`${p.name.padEnd(55)} ${p.category.padEnd(12)} ${String(p.questionCount).padEnd(10)} ${p.rfqCount}`);
  });

  // Show products without questions
  if (productsWithoutQuestions.length > 0) {
    console.log('\n⚠️  PRODUCTS WITHOUT QUESTIONS');
    console.log('='.repeat(80));
    console.log(`${'Product Name'.padEnd(55)} ${'Category'.padEnd(12)} ${'Questions'.padEnd(10)} RFQs`);
    console.log('-'.repeat(80));
    productsWithoutQuestions.forEach(p => {
      const marker = p.rfqCount > 0 ? '❌' : '  ';
      console.log(`${marker} ${p.name.padEnd(53)} ${p.category.padEnd(12)} ${String(p.questionCount).padEnd(10)} ${p.rfqCount}`);
    });
  }

  // Show problematic products in detail
  if (problematicProducts.length > 0) {
    console.log('\n\n❌ CRITICAL: PRODUCTS WITH RFQs BUT NO QUESTIONS');
    console.log('='.repeat(80));
    console.log('These products have RFQs created but no questions loaded!');
    console.log('Users will see "No questions configured" error.\n');

    for (const p of problematicProducts) {
      console.log(`\n${p.name}`);
      console.log(`  Product ID: ${p.id}`);
      console.log(`  Category: ${p.category}`);
      console.log(`  RFQs created: ${p.rfqCount}`);
      console.log(`  Questions loaded: ${p.questionCount}`);

      // Try to find similar product names that DO have questions
      const similar = productsWithQuestions.filter(q =>
        q.name.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]) ||
        p.name.toLowerCase().includes(q.name.toLowerCase().split(' ')[0])
      );

      if (similar.length > 0) {
        console.log(`  💡 Possible match with questions:`);
        similar.forEach(s => {
          console.log(`     - "${s.name}" (${s.questionCount} questions)`);
        });
      }
    }
  }

  // Check for potential duplicates
  console.log('\n\n🔍 CHECKING FOR POTENTIAL DUPLICATES');
  console.log('='.repeat(80));

  const nameGroups = {};
  products.forEach(p => {
    const baseName = p.name.toLowerCase().replace(/insurance|policy/gi, '').trim();
    if (!nameGroups[baseName]) {
      nameGroups[baseName] = [];
    }
    nameGroups[baseName].push(p);
  });

  const duplicates = Object.entries(nameGroups).filter(([_, prods]) => prods.length > 1);

  if (duplicates.length > 0) {
    console.log('Found potential duplicate products:\n');
    duplicates.forEach(([baseName, prods]) => {
      console.log(`Base name: "${baseName}"`);
      prods.forEach(p => {
        const qCount = questionCountMap[p.id] || 0;
        const rCount = rfqCountMap[p.id] || 0;
        console.log(`  - "${p.name}" (${qCount} questions, ${rCount} RFQs)`);
      });
      console.log('');
    });
  } else {
    console.log('No obvious duplicates found.');
  }

  // Final recommendations
  console.log('\n\n💡 RECOMMENDATIONS');
  console.log('='.repeat(80));

  if (problematicProducts.length > 0) {
    console.log('1. Run migration 011_fix_product_duplicates.sql to:');
    console.log('   - Migrate RFQs to products with questions');
    console.log('   - Delete products without questions');
    console.log('');
  }

  if (productsWithoutQuestions.length > productsWithQuestions.length) {
    console.log('2. Load questions for missing products using:');
    console.log('   node scripts/load-rfq-questions.js');
    console.log('');
  }

  console.log('3. After migration, re-run this diagnostic to verify fixes.');
  console.log('');
  console.log('✓ Diagnosis complete!');
}

diagnose().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
