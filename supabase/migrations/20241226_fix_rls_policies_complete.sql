-- Complete RLS Policy Fix for User Registration and Profile Access
-- This migration ensures proper access control without 406 errors

-- First, drop any existing policies that might conflict
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile during signup" ON public.users;

-- Recreate comprehensive RLS policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can create own profile during signup" ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Add missing policies for other tables that might cause 406 errors

-- RFQ Templates (should be readable by all authenticated users)
DROP POLICY IF EXISTS "Authenticated users can view RFQ templates" ON public.rfq_templates;
CREATE POLICY "Authenticated users can view RFQ templates" ON public.rfq_templates
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Ensure RFQ templates table has RLS enabled
ALTER TABLE public.rfq_templates ENABLE ROW LEVEL SECURITY;

-- RFQs policies (already exist but ensure they're correct)
DROP POLICY IF EXISTS "Users can view own RFQs" ON public.rfqs;
DROP POLICY IF EXISTS "Users can create RFQs" ON public.rfqs;
DROP POLICY IF EXISTS "Users can update own RFQs" ON public.rfqs;

CREATE POLICY "Users can view own RFQs" ON public.rfqs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create RFQs" ON public.rfqs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own RFQs" ON public.rfqs
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Quotes policies (for viewing quotes on user's RFQs)
DROP POLICY IF EXISTS "Users can view quotes for their RFQs" ON public.quotes;
CREATE POLICY "Users can view quotes for their RFQs" ON public.quotes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.rfqs
            WHERE rfqs.id = quotes.rfq_id
            AND rfqs.user_id = auth.uid()
        )
    );

-- Bid invitations (users can view invitations for their RFQs)
DROP POLICY IF EXISTS "Users can view bid invitations for their RFQs" ON public.bid_invitations;
CREATE POLICY "Users can view bid invitations for their RFQs" ON public.bid_invitations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.rfqs
            WHERE rfqs.id = bid_invitations.rfq_id
            AND rfqs.user_id = auth.uid()
        )
    );

-- Payments (users can view their own payments)
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments" ON public.payments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Communications (users can view communications for their RFQs)
DROP POLICY IF EXISTS "Users can view communications for their RFQs" ON public.communications;
CREATE POLICY "Users can view communications for their RFQs" ON public.communications
    FOR SELECT
    USING (
        auth.uid() = sender_id OR
        EXISTS (
            SELECT 1 FROM public.rfqs
            WHERE rfqs.id = communications.rfq_id
            AND rfqs.user_id = auth.uid()
        )
    );

-- Quote analyses (users can view analyses for quotes on their RFQs)
DROP POLICY IF EXISTS "Users can view quote analyses for their RFQs" ON public.quote_analyses;
CREATE POLICY "Users can view quote analyses for their RFQs" ON public.quote_analyses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.rfqs
            WHERE rfqs.id = quote_analyses.rfq_id
            AND rfqs.user_id = auth.uid()
        )
    );

-- Ensure all tables have RLS enabled
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_analyses ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT SELECT ON public.rfq_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.rfqs TO authenticated;
GRANT SELECT ON public.quotes TO authenticated;
GRANT SELECT ON public.bid_invitations TO authenticated;
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT SELECT ON public.communications TO authenticated;
GRANT SELECT ON public.quote_analyses TO authenticated;

-- Create function to handle user profile creation on signup (optional enhancement)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be used with a trigger to auto-create user profiles
  -- when a new user signs up via auth.users
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger would be created like this if needed:
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();