-- Migration 006: Fix Users Table SELECT Policy
-- Purpose: Resolve 500 error when querying users table
-- Issue: SELECT policy may be causing errors for authenticated users
-- Date: October 1, 2025

-- =====================================================
-- PROBLEM DIAGNOSIS
-- =====================================================
-- Logs show 500 errors on:
-- GET /rest/v1/users?select=onboarding_completed&id=eq.USER_ID
--
-- This suggests the SELECT policy is failing or conflicting

-- =====================================================
-- SOLUTION: Recreate SELECT Policy Safely
-- =====================================================

-- Drop existing SELECT policies to start fresh
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all data" ON public.users;

-- Create clean SELECT policy for authenticated users
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
  );

-- Create admin SELECT policy (if needed)
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- ENSURE UPDATE POLICY EXISTS
-- =====================================================
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- CHECK INSERT POLICIES (should exist from migration 004)
-- =====================================================
-- These should already exist, but let's verify they're correct

-- For service_role (trigger)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users'
      AND policyname = 'Service role can insert users'
  ) THEN
    CREATE POLICY "Service role can insert users" ON public.users
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;

-- For anon (edge case during signup)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users'
      AND policyname = 'Allow anon insert during signup'
  ) THEN
    CREATE POLICY "Allow anon insert during signup" ON public.users
      FOR INSERT
      TO anon
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- =====================================================
-- GRANT NECESSARY PERMISSIONS
-- =====================================================
-- Ensure authenticated role can SELECT from users table
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE ON public.users TO authenticated;

-- Ensure service_role can INSERT
GRANT INSERT ON public.users TO service_role;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check all policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- Expected output:
-- INSERT | Allow anon insert during signup | {anon}
-- INSERT | Service role can insert users | {service_role}
-- SELECT | Admins can view all users | {authenticated}
-- SELECT | Users can view own profile | {authenticated}
-- UPDATE | Users can update own profile | {authenticated}

-- =====================================================
-- TEST QUERY (run after migration)
-- =====================================================
-- This simulates what the app does
-- Replace USER_ID with actual user ID

-- Test as authenticated user
-- SET request.jwt.claim.sub = 'YOUR_USER_ID';
-- SET request.jwt.claim.role = 'authenticated';
-- SET role authenticated;
-- SELECT id, email, onboarding_completed FROM public.users WHERE id = 'YOUR_USER_ID';
-- RESET role;

COMMENT ON POLICY "Users can view own profile" ON public.users IS
  'Migration 006: Fixed SELECT policy to prevent 500 errors';
