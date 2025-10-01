-- Migration 005: Fix Company Members RLS for Onboarding
-- Purpose: Allow users to create their first company membership during onboarding
-- Issue: RLS policy blocks self-adding to company during onboarding
-- Date: October 1, 2025

-- =====================================================
-- PROBLEM
-- =====================================================
-- The current company_members policy requires:
--   "You must be an owner/admin of the company to manage members"
-- BUT during onboarding, the company_members table is EMPTY
-- So the user can't add themselves as the first owner
-- This creates a chicken-and-egg problem!

-- =====================================================
-- SOLUTION
-- =====================================================
-- Add a special INSERT policy that allows:
-- 1. Company creators to add themselves as owner
-- 2. Existing owners/admins to add other members

-- Drop the overly restrictive "FOR ALL" policy
DROP POLICY IF EXISTS "Company owners can manage members" ON public.company_members;

-- =====================================================
-- POLICY: Users can add themselves as owner during company creation
-- =====================================================
CREATE POLICY "Users can add self as owner of own company" ON public.company_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if they're adding themselves as owner of a company they created
    user_id = auth.uid()
    AND role = 'owner'
    AND company_id IN (
      SELECT id FROM public.companies
      WHERE created_by = auth.uid()
    )
  );

-- =====================================================
-- POLICY: Existing owners/admins can add other members
-- =====================================================
CREATE POLICY "Company owners can add members" ON public.company_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is already an owner/admin of this company
    company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- =====================================================
-- POLICY: View members of companies you belong to
-- =====================================================
-- This should already exist from migration 001, recreate to be sure
DROP POLICY IF EXISTS "Users can view company members" ON public.company_members;

CREATE POLICY "Users can view company members" ON public.company_members
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- =====================================================
-- POLICY: Owners/admins can update members
-- =====================================================
CREATE POLICY "Company owners can update members" ON public.company_members
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- =====================================================
-- POLICY: Owners can remove members
-- =====================================================
CREATE POLICY "Company owners can delete members" ON public.company_members
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
    -- Prevent owners from removing themselves if they're the last owner
    AND NOT (
      user_id = auth.uid()
      AND role = 'owner'
      AND (
        SELECT COUNT(*) FROM public.company_members
        WHERE company_id = company_members.company_id
          AND role = 'owner'
          AND status = 'active'
      ) = 1
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check all policies on company_members:
-- SELECT policyname, cmd, roles, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'company_members'
-- ORDER BY cmd, policyname;

-- Expected policies:
-- 1. "Users can add self as owner of own company" - INSERT
-- 2. "Company owners can add members" - INSERT
-- 3. "Users can view company members" - SELECT
-- 4. "Company owners can update members" - UPDATE
-- 5. "Company owners can delete members" - DELETE

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON POLICY "Users can add self as owner of own company" ON public.company_members IS
  'Migration 005: Allows company creators to add themselves as the first owner during onboarding';

COMMENT ON POLICY "Company owners can add members" ON public.company_members IS
  'Migration 005: Allows existing owners/admins to invite additional members';
