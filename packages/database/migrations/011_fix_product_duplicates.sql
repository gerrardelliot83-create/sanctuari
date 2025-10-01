-- Migration 011: Fix Product Duplicates and Mismatches
-- Date: October 2, 2025
-- Problem: Two sets of products exist - migration 001 created 15 products,
--          but load-rfq-questions.js created 45 products based on JSON product_name.
--          This causes RFQs to reference products with no questions.
-- Solution: Remove old migration 001 products and standardize on JSON product names.
--
-- IMPORTANT: This migration is safe because:
-- 1. It first migrates ALL RFQs to products that have questions (STEP 3)
-- 2. Only then deletes products without questions (STEP 4)
-- 3. The rfqs table has "ON DELETE RESTRICT" on product_id foreign key,
--    so deletion will fail if any RFQ still references a product
-- 4. The rfq_questions table has "ON DELETE CASCADE", so questions are auto-deleted
--
-- ROLLBACK: Not needed - this is a cleanup operation. If issues occur, re-run
--           the load-rfq-questions.js script to reload all 45 products and questions.

-- =====================================================
-- STEP 1: Identify products that have questions
-- =====================================================

-- Create a temporary table to track products with questions
CREATE TEMP TABLE products_with_questions AS
SELECT DISTINCT product_id, COUNT(*) as question_count
FROM rfq_questions
GROUP BY product_id;

-- =====================================================
-- STEP 2: Identify products from migration 001 that are duplicates
-- =====================================================

-- These are the 15 products created in migration 001 that may have duplicates
-- or may not have questions loaded:
-- 1. Fire and Special Perils Insurance (matches: Standard Fire and Special Perils Insurance)
-- 2. Marine Cargo Insurance (exact match in JSON)
-- 3. Marine Transit Insurance (exact match in JSON)
-- 4. Group Health Insurance (exact match in JSON)
-- 5. Group Personal Accident Insurance (exact match in JSON)
-- 6. Group Term Life Insurance (exact match in JSON)
-- 7. Cyber Liability Insurance (exact match in JSON)
-- 8. Directors & Officers Liability Insurance (matches: Directors and Officers Liability Insurance)
-- 9. Professional Indemnity Insurance (exact match in JSON)
-- 10. Commercial General Liability (matches: Commercial General Liability Insurance)
-- 11. Product Liability Insurance (no JSON match - not loaded)
-- 12. Workmen's Compensation Insurance (matches: Workmen's Compensation Insurance)
-- 13. Business Interruption Insurance (exact match in JSON)
-- 14. Contractors All Risk (matches: Contractors All Risk Insurance)
-- 15. Machinery Breakdown Insurance (matches: Machinery Breakdown Policy)

-- =====================================================
-- STEP 3: Migrate RFQs from old products to new products
-- =====================================================

-- Update RFQs that reference old product names to point to the correct new products

-- Update "Fire and Special Perils Insurance" -> "Standard Fire and Special Perils Insurance"
UPDATE rfqs
SET product_id = (
  SELECT id FROM insurance_products
  WHERE name = 'Standard Fire and Special Perils Insurance'
  LIMIT 1
)
WHERE product_id IN (
  SELECT id FROM insurance_products
  WHERE name = 'Fire and Special Perils Insurance'
  AND id NOT IN (SELECT product_id FROM products_with_questions)
);

-- Update "Directors & Officers Liability Insurance" -> "Directors and Officers Liability Insurance"
UPDATE rfqs
SET product_id = (
  SELECT id FROM insurance_products
  WHERE name = 'Directors and Officers Liability Insurance'
  LIMIT 1
)
WHERE product_id IN (
  SELECT id FROM insurance_products
  WHERE name = 'Directors & Officers Liability Insurance'
  AND id NOT IN (SELECT product_id FROM products_with_questions)
);

-- Update "Commercial General Liability" -> "Commercial General Liability Insurance"
UPDATE rfqs
SET product_id = (
  SELECT id FROM insurance_products
  WHERE name = 'Commercial General Liability Insurance'
  LIMIT 1
)
WHERE product_id IN (
  SELECT id FROM insurance_products
  WHERE name = 'Commercial General Liability'
  AND id NOT IN (SELECT product_id FROM products_with_questions)
);

-- Update "Contractors All Risk" -> "Contractors All Risk Insurance"
UPDATE rfqs
SET product_id = (
  SELECT id FROM insurance_products
  WHERE name = 'Contractors All Risk Insurance'
  LIMIT 1
)
WHERE product_id IN (
  SELECT id FROM insurance_products
  WHERE name = 'Contractors All Risk'
  AND id NOT IN (SELECT product_id FROM products_with_questions)
);

-- Update "Machinery Breakdown Insurance" -> "Machinery Breakdown Policy"
UPDATE rfqs
SET product_id = (
  SELECT id FROM insurance_products
  WHERE name = 'Machinery Breakdown Policy'
  LIMIT 1
)
WHERE product_id IN (
  SELECT id FROM insurance_products
  WHERE name = 'Machinery Breakdown Insurance'
  AND id NOT IN (SELECT product_id FROM products_with_questions)
);

-- =====================================================
-- STEP 4: Delete old migration 001 products with no questions
-- =====================================================

-- Delete products that have no questions loaded
-- This removes the migration 001 products that are duplicates or unused
-- RFQs have already been migrated to the correct products in STEP 3

DELETE FROM insurance_products
WHERE id NOT IN (SELECT product_id FROM products_with_questions);

-- =====================================================
-- STEP 5: Safety Check - Ensure no orphaned RFQs
-- =====================================================

-- This query will raise an error if any RFQs reference non-existent products
DO $$
DECLARE
  orphaned_rfqs INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO orphaned_rfqs
  FROM rfqs r
  WHERE NOT EXISTS (
    SELECT 1 FROM insurance_products p WHERE p.id = r.product_id
  );

  IF orphaned_rfqs > 0 THEN
    RAISE EXCEPTION 'Migration failed: % RFQs reference non-existent products!', orphaned_rfqs;
  END IF;

  RAISE NOTICE 'Migration successful: All RFQs have valid product references';
END $$;

-- =====================================================
-- STEP 6: Verification Query (for manual check)
-- =====================================================

-- Run this after migration to verify state:
-- SELECT
--   p.name,
--   p.category,
--   p.is_active,
--   COUNT(DISTINCT q.id) as question_count,
--   COUNT(DISTINCT r.id) as rfq_count
-- FROM insurance_products p
-- LEFT JOIN rfq_questions q ON q.product_id = p.id
-- LEFT JOIN rfqs r ON r.product_id = p.id
-- GROUP BY p.id, p.name, p.category, p.is_active
-- ORDER BY p.name;

-- Expected result:
-- - All products should have question_count > 0
-- - No products should have rfq_count > 0 AND question_count = 0

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE insurance_products IS 'Insurance products - updated to match JSON file product names (45 products loaded from Resources/processed-rfq-questions/)';
