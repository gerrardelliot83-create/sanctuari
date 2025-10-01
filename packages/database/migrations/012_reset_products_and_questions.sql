-- Migration 012: Reset All Products and Questions
-- Date: October 2, 2025
-- Problem: Some products in database don't match JSON file product names
-- Solution: Clean slate - delete all products and questions, then reload from JSON
--
-- IMPORTANT: This migration deletes ALL products and questions
-- After running this, you MUST run: node scripts/reload-all-products.js
--
-- SAFETY:
-- - RFQs are NOT deleted (they will be updated by the reload script)
-- - Foreign key on rfqs.product_id will be temporarily violated
-- - The reload script will fix all RFQ references

-- =====================================================
-- STEP 1: Store RFQ to Product Name Mapping
-- =====================================================

-- Create a temporary table to preserve RFQ -> Product Name mapping
CREATE TEMP TABLE rfq_product_mapping AS
SELECT
  r.id as rfq_id,
  r.product_id as old_product_id,
  p.name as product_name,
  r.title,
  r.user_id,
  r.company_id,
  r.status
FROM rfqs r
JOIN insurance_products p ON p.id = r.product_id;

-- Show what we're preserving
DO $$
DECLARE
  rfq_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rfq_count FROM rfq_product_mapping;
  RAISE NOTICE 'Preserved % RFQ mappings for restoration', rfq_count;
END $$;

-- =====================================================
-- STEP 2: Temporarily disable foreign key constraint
-- =====================================================

-- Remove the foreign key constraint on rfqs.product_id
-- We'll add it back after reloading
ALTER TABLE rfqs DROP CONSTRAINT IF EXISTS rfqs_product_id_fkey;

-- =====================================================
-- STEP 3: Delete all questions and products
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Disabled foreign key constraint on rfqs.product_id';

  -- Delete all questions (will cascade from products anyway, but explicit is good)
  DELETE FROM rfq_questions;
  RAISE NOTICE 'Deleted all RFQ questions';

  -- Delete all products
  DELETE FROM insurance_products;
  RAISE NOTICE 'Deleted all insurance products';
END $$;

-- =====================================================
-- STEP 4: Information for next step
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 012 Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEP (REQUIRED):';
  RAISE NOTICE 'Run the reload script to restore products and questions:';
  RAISE NOTICE '';
  RAISE NOTICE '  cd /mnt/c/Users/DELL/Desktop/sanctuari';
  RAISE NOTICE '  node scripts/reload-all-products.js';
  RAISE NOTICE '';
  RAISE NOTICE 'This script will:';
  RAISE NOTICE '  1. Load all 45 products from JSON files';
  RAISE NOTICE '  2. Load all questions for each product';
  RAISE NOTICE '  3. Update RFQs to point to correct products';
  RAISE NOTICE '  4. Re-enable foreign key constraint';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE insurance_products IS 'Insurance products - Reset and reloaded from JSON files in Resources/processed-rfq-questions/';
