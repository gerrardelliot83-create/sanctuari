-- Migration 015: Add RLS Policies for RFQ Invitations
-- Date: October 2, 2025
-- Purpose: Fix "new row violates row-level security policy" error when creating invitations

-- =====================================================
-- RFQ INVITATIONS POLICIES
-- =====================================================

-- Users can view invitations for their own RFQs
CREATE POLICY "Users can view invitations for own RFQs" ON public.rfq_invitations
  FOR SELECT USING (
    rfq_id IN (SELECT id FROM public.rfqs WHERE user_id = auth.uid())
  );

-- Users can create invitations for their own RFQs
CREATE POLICY "Users can create invitations for own RFQs" ON public.rfq_invitations
  FOR INSERT WITH CHECK (
    rfq_id IN (SELECT id FROM public.rfqs WHERE user_id = auth.uid())
  );

-- Users can update invitations for their own RFQs
CREATE POLICY "Users can update invitations for own RFQs" ON public.rfq_invitations
  FOR UPDATE USING (
    rfq_id IN (SELECT id FROM public.rfqs WHERE user_id = auth.uid())
  );

-- =====================================================
-- BID DOCUMENTS POLICIES (Also Missing)
-- =====================================================

-- Users can view bid documents for bids on their RFQs
CREATE POLICY "Users can view bid documents for own RFQs" ON public.bid_documents
  FOR SELECT USING (
    bid_id IN (
      SELECT id FROM public.bids
      WHERE rfq_id IN (SELECT id FROM public.rfqs WHERE user_id = auth.uid())
    )
  );

-- =====================================================
-- MESSAGES POLICIES (Also Missing)
-- =====================================================

-- Users can view messages for their RFQs
CREATE POLICY "Users can view messages for own RFQs" ON public.messages
  FOR SELECT USING (
    rfq_id IN (SELECT id FROM public.rfqs WHERE user_id = auth.uid())
  );

-- Users can send messages for their RFQs
CREATE POLICY "Users can send messages for own RFQs" ON public.messages
  FOR INSERT WITH CHECK (
    rfq_id IN (SELECT id FROM public.rfqs WHERE user_id = auth.uid())
    AND sender_type = 'client'
  );

-- =====================================================
-- EMAIL LOGS POLICIES (Also Missing)
-- =====================================================

-- Users can view email logs for their RFQs
CREATE POLICY "Users can view email logs for own RFQs" ON public.email_logs
  FOR SELECT USING (
    rfq_id IN (SELECT id FROM public.rfqs WHERE user_id = auth.uid())
  );

-- System can create email logs (using service role key)
-- Note: Email logs are created by backend, so we need a policy that allows service role
CREATE POLICY "Service role can create email logs" ON public.email_logs
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- AUDIT LOGS POLICIES (Also Missing)
-- =====================================================

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- System can create audit logs
CREATE POLICY "Service role can create audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 015 Complete!';
  RAISE NOTICE 'RLS policies added for:';
  RAISE NOTICE '  - rfq_invitations (SELECT, INSERT, UPDATE)';
  RAISE NOTICE '  - bid_documents (SELECT)';
  RAISE NOTICE '  - messages (SELECT, INSERT)';
  RAISE NOTICE '  - email_logs (SELECT, INSERT)';
  RAISE NOTICE '  - audit_logs (SELECT, INSERT)';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Distribution API should now work!';
  RAISE NOTICE 'Users can create invitations for their RFQs.';
  RAISE NOTICE '========================================';
END $$;
