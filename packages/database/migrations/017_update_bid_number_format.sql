-- Migration 017: Update Bid Number Format
-- Date: October 8, 2025
-- Purpose: Change RFQ number format from "RFQ-2025-0001" to "BID-2025-0001"

-- =====================================================
-- UPDATE BID NUMBER GENERATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION generate_rfq_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  sequence_num INTEGER;
  bid_num TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');

  -- Look for BID- prefix instead of RFQ-
  -- This ensures backwards compatibility: will start from highest existing number + 1
  SELECT COALESCE(
    GREATEST(
      -- Check for existing BID- format numbers
      MAX(CAST(SUBSTRING(rfq_number FROM 'BID-\d{4}-(\d+)') AS INTEGER)),
      -- Check for existing RFQ- format numbers
      MAX(CAST(SUBSTRING(rfq_number FROM 'RFQ-\d{4}-(\d+)') AS INTEGER)),
      0
    ),
    0
  ) + 1
  INTO sequence_num
  FROM public.rfqs
  WHERE rfq_number LIKE 'BID-' || year || '-%'
     OR rfq_number LIKE 'RFQ-' || year || '-%';

  -- Generate new number with BID- prefix
  bid_num := 'BID-' || year || '-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN bid_num;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 017 Complete!';
  RAISE NOTICE 'Updated bid number generation function';
  RAISE NOTICE 'New format: BID-YYYY-0001';
  RAISE NOTICE 'Old format (RFQ-) still readable for compatibility';
  RAISE NOTICE '========================================';
END $$;
