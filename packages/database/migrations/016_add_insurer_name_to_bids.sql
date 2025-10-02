-- Migration 016: Add insurer_name field to bids table
-- Date: October 3, 2025
-- Purpose: Support broker submissions where they specify which insurer the quote is from

-- Add insurer_name column to bids table
ALTER TABLE public.bids
ADD COLUMN insurer_name TEXT;

-- Add comment
COMMENT ON COLUMN public.bids.insurer_name IS 'For broker submissions: which insurer is this quote from';

-- Update existing records (set to bidder_company_name for backfill)
UPDATE public.bids
SET insurer_name = bidder_company_name
WHERE insurer_name IS NULL;

-- Completion message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 016 Complete!';
  RAISE NOTICE 'Added insurer_name to bids table';
  RAISE NOTICE 'This supports brokers submitting quotes';
  RAISE NOTICE 'from multiple insurers';
  RAISE NOTICE '========================================';
END $$;
