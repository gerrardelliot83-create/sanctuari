-- Migration 010: Make rfq_number nullable for draft RFQs
-- Purpose: Allow RFQ creation without rfq_number (generated on publish)
-- Issue: Draft RFQs were failing due to NOT NULL constraint
-- Date: October 1, 2025

-- =====================================================
-- PROBLEM
-- =====================================================
-- The rfq_number field has NOT NULL constraint but is only
-- generated when RFQ is published, not when created as draft.
-- This prevents draft RFQ creation.

-- =====================================================
-- SOLUTION
-- =====================================================
-- Make rfq_number nullable and add UNIQUE constraint only for non-null values

ALTER TABLE public.rfqs
ALTER COLUMN rfq_number DROP NOT NULL;

-- Drop existing unique constraint if it exists
ALTER TABLE public.rfqs DROP CONSTRAINT IF EXISTS rfqs_rfq_number_key;

-- Create partial unique index (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS rfqs_rfq_number_unique
ON public.rfqs (rfq_number)
WHERE rfq_number IS NOT NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Test draft RFQ creation
-- INSERT INTO public.rfqs (user_id, company_id, product_id, title, status)
-- VALUES ('user-uuid', 'company-uuid', 'product-uuid', 'Test RFQ', 'draft')
-- RETURNING *;

-- Test published RFQ with rfq_number
-- UPDATE public.rfqs
-- SET rfq_number = generate_rfq_number(), status = 'published'
-- WHERE id = 'rfq-uuid'
-- RETURNING *;

COMMENT ON COLUMN public.rfqs.rfq_number IS
  'Migration 010: Nullable for drafts, auto-generated on publish. Unique constraint via partial index.';
