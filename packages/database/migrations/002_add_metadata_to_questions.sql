-- Add metadata column to rfq_questions table to store enhancement data

ALTER TABLE public.rfq_questions
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add comment
COMMENT ON COLUMN public.rfq_questions.metadata IS 'Stores enhancement metadata: format, auto_fill_source, policy_extractable, etc.';

-- Create index for faster metadata queries
CREATE INDEX IF NOT EXISTS idx_rfq_questions_metadata ON public.rfq_questions USING GIN (metadata);

-- Example metadata structure:
-- {
--   "format": "indian_currency",
--   "auto_fill_source": "company_profile",
--   "auto_fill_enabled": true,
--   "policy_extractable": true,
--   "extraction_priority": "high",
--   "has_other_option": true,
--   "other_field": {...}
-- }
