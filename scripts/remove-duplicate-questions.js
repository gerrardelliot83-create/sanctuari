/**
 * Remove Duplicate Questions Script
 *
 * Problem: Some questions were inserted twice during the reload process
 * Solution: Keep the first occurrence of each question (by field_name within product)
 *           and delete the duplicates
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://trjutifvugvnfsxbelns.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyanV0aWZ2dWd2bmZzeGJlbG5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTMxODU5NCwiZXhwIjoyMDc0ODk0NTk0fQ.yyUCgvVZ3YHT-uP2icaN5NSiptqynEbCm3vZ9DYq0Vc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function removeDuplicates() {
  console.log('=== Removing Duplicate Questions ===\n');

  // Get all products
  const { data: products } = await supabase
    .from('insurance_products')
    .select('id, name')
    .order('name');

  console.log(`Checking ${products.length} products...\n`);

  let totalDuplicatesRemoved = 0;

  for (const product of products) {
    // Get all questions for this product
    const { data: questions } = await supabase
      .from('rfq_questions')
      .select('id, field_name, created_at')
      .eq('product_id', product.id)
      .order('created_at', { ascending: true }); // Keep oldest (first) ones

    if (!questions || questions.length === 0) continue;

    // Group by field_name
    const fieldGroups = {};
    questions.forEach(q => {
      if (!fieldGroups[q.field_name]) {
        fieldGroups[q.field_name] = [];
      }
      fieldGroups[q.field_name].push(q);
    });

    // Find duplicates (more than 1 question with same field_name)
    const duplicates = Object.entries(fieldGroups).filter(([_, qs]) => qs.length > 1);

    if (duplicates.length > 0) {
      console.log(`${product.name}:`);
      console.log(`  Total questions: ${questions.length}`);
      console.log(`  Duplicate fields: ${duplicates.length}`);

      let productDuplicatesRemoved = 0;

      for (const [fieldName, questionGroup] of duplicates) {
        // Keep the first (oldest) question, delete the rest
        const [keep, ...toDelete] = questionGroup;

        const idsToDelete = toDelete.map(q => q.id);

        // Delete duplicates
        const { error } = await supabase
          .from('rfq_questions')
          .delete()
          .in('id', idsToDelete);

        if (error) {
          console.log(`  ❌ Error deleting duplicates for ${fieldName}:`, error.message);
        } else {
          productDuplicatesRemoved += idsToDelete.length;
        }
      }

      console.log(`  ✓ Removed ${productDuplicatesRemoved} duplicate questions\n`);
      totalDuplicatesRemoved += productDuplicatesRemoved;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total duplicate questions removed: ${totalDuplicatesRemoved}`);
  console.log('\n✓ Cleanup complete!');
}

removeDuplicates().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
