-- Migration 018: Add Email Tracking Fields to rfq_invitations
-- Date: October 8, 2025
-- Purpose: Add fields for detailed email tracking (delivered, opened, clicked, bounced)

-- =====================================================
-- ADD EMAIL TRACKING COLUMNS
-- =====================================================

ALTER TABLE public.rfq_invitations
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bounce_reason TEXT,
ADD COLUMN IF NOT EXISTS reminders_sent TEXT[],
ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- ADD INDEX FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rfq_invitations_delivered
ON public.rfq_invitations(delivered_at);

CREATE INDEX IF NOT EXISTS idx_rfq_invitations_clicked
ON public.rfq_invitations(clicked_at);

-- =====================================================
-- UPDATE COMMENTS
-- =====================================================

COMMENT ON COLUMN public.rfq_invitations.delivered_at IS 'Timestamp when email was successfully delivered to inbox (from Brevo webhook)';
COMMENT ON COLUMN public.rfq_invitations.opened_at IS 'Timestamp when recipient opened the email (from Brevo webhook)';
COMMENT ON COLUMN public.rfq_invitations.clicked_at IS 'Timestamp when recipient clicked link in email (from Brevo webhook)';
COMMENT ON COLUMN public.rfq_invitations.bounce_reason IS 'Reason for email bounce or failure (from Brevo webhook)';
COMMENT ON COLUMN public.rfq_invitations.reminders_sent IS 'Array of reminder types sent (e.g., [''3day'', ''1day''])';
COMMENT ON COLUMN public.rfq_invitations.last_reminder_at IS 'Timestamp of last reminder email sent';

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 018 Complete!';
  RAISE NOTICE 'Added email tracking & reminder fields to rfq_invitations';
  RAISE NOTICE 'Tracking fields: delivered_at, clicked_at, bounce_reason';
  RAISE NOTICE 'Reminder fields: reminders_sent, last_reminder_at';
  RAISE NOTICE 'Configure Brevo webhook to: /api/webhooks/brevo';
  RAISE NOTICE 'Configure cron job to: /api/cron/send-reminders';
  RAISE NOTICE '========================================';
END $$;
