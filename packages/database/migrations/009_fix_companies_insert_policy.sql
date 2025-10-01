-- Migration 009: Fix Companies INSERT Policy
-- Purpose: Allow authenticated users to INSERT companies
-- Issue: RLS policy blocks company creation during onboarding
-- Date: October 1, 2025

-- =====================================================
-- PROBLEM
-- =====================================================
-- Error: "new row violates row-level security policy for table companies"
-- The existing INSERT policy may be missing or too restrictive

-- =====================================================
-- CHECK EXISTING POLICIES
-- =====================================================
SELECT policyname, cmd, roles::text
FROM pg_policies
WHERE tablename = 'companies';

-- =====================================================
-- DROP AND RECREATE INSERT POLICY
-- =====================================================

-- Drop existing INSERT policy if any
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;

-- Create simple INSERT policy for authenticated users
CREATE POLICY "authenticated_can_create_companies" ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Users can only create companies where they are the creator
    created_by = auth.uid()
  );

-- =====================================================
-- ENSURE OTHER POLICIES EXIST
-- =====================================================

-- SELECT policy (should already exist from migration 001)
DROP POLICY IF EXISTS "Users can view member companies" ON public.companies;

CREATE POLICY "users_can_view_member_companies" ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    -- Users can view companies they created
    created_by = auth.uid()
    OR
    -- OR companies they are members of (non-recursive check)
    -- Note: We use EXISTS to avoid selecting from company_members
    id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- UPDATE policy
DROP POLICY IF EXISTS "Company owners and admins can update" ON public.companies;

CREATE POLICY "creators_can_update_companies" ON public.companies
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
  );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT INSERT, SELECT, UPDATE ON public.companies TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT tablename, policyname, cmd, roles::text
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY cmd, policyname;

-- Expected output:
-- - authenticated_can_create_companies (INSERT, {authenticated})
-- - users_can_view_member_companies (SELECT, {authenticated})
-- - creators_can_update_companies (UPDATE, {authenticated})

COMMENT ON POLICY "authenticated_can_create_companies" ON public.companies IS
  'Migration 009: Allow authenticated users to create companies where they are the creator';
