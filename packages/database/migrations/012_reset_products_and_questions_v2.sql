-- Migration 012: Reset All Products and Questions
-- Date: October 2, 2025
-- This migration deletes ALL products and questions for a clean reload

-- Step 1: Drop foreign key constraint
ALTER TABLE rfqs DROP CONSTRAINT IF EXISTS rfqs_product_id_fkey;

-- Step 2: Delete all questions
DELETE FROM rfq_questions;

-- Step 3: Delete all products
DELETE FROM insurance_products;

-- Step 4: Show completion message
DO $$
BEGIN
  RAISE NOTICE 'Migration 012 Complete!';
  RAISE NOTICE 'All products and questions deleted.';
  RAISE NOTICE 'Next step: Run node scripts/reload-all-products.js --clean';
END $$;
