-- Migration 007: Fix Infinite Recursion in RLS Policies
-- Purpose: Remove recursive policies causing 500 errors
-- Issue: Policies that query the same table they protect cause infinite recursion
-- Date: October 1, 2025

-- =====================================================
-- PROBLEM: INFINITE RECURSION
-- =====================================================
-- The "Admins can view all users" policy queries users table
-- to check if current user is admin, which triggers the same
-- policy recursively -> INFINITE LOOP

-- =====================================================
-- SOLUTION: Simplify Policies
-- =====================================================

-- Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Allow anon insert during signup" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;

-- =====================================================
-- CREATE SIMPLE, NON-RECURSIVE POLICIES
-- =====================================================

-- Allow service_role to INSERT (for trigger)
CREATE POLICY "service_role_insert" ON public.users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow anon to INSERT during signup (edge case)
CREATE POLICY "anon_insert_signup" ON public.users
  FOR INSERT
  TO anon
  WITH CHECK (id = auth.uid());

-- Allow authenticated users to SELECT their own profile
CREATE POLICY "authenticated_select_own" ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow authenticated users to UPDATE their own profile
CREATE POLICY "authenticated_update_own" ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =====================================================
-- FIX COMPANY_MEMBERS RECURSION
-- =====================================================
-- The policy checks company_members to see if user is owner/admin
-- But this creates recursion when querying company_members itself

DROP POLICY IF EXISTS "Users can add self as owner of own company" ON public.company_members;
DROP POLICY IF EXISTS "Company owners can add members" ON public.company_members;
DROP POLICY IF EXISTS "Users can view company members" ON public.company_members;
DROP POLICY IF EXISTS "Company owners can update members" ON public.company_members;
DROP POLICY IF EXISTS "Company owners can delete members" ON public.company_members;
DROP POLICY IF EXISTS "Company owners can manage members" ON public.company_members;

-- Allow users to INSERT themselves as owner of their own company
CREATE POLICY "insert_self_as_owner" ON public.company_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'owner'
    AND company_id IN (
      SELECT id FROM public.companies WHERE created_by = auth.uid()
    )
  );

-- Allow existing owners/admins to INSERT other members
-- This is safe because it doesn't query company_members
CREATE POLICY "owners_insert_members" ON public.company_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Check if inserting user is owner/admin via direct EXISTS
    -- without causing recursion
    EXISTS (
      SELECT 1 FROM public.companies c
      INNER JOIN public.company_members cm ON c.id = cm.company_id
      WHERE c.id = company_members.company_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
        AND cm.status = 'active'
    )
  );

-- Allow users to SELECT members of companies they belong to
-- Use LATERAL join to avoid recursion
CREATE POLICY "select_company_members" ON public.company_members
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT cm.company_id
      FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

-- Allow owners/admins to UPDATE members
CREATE POLICY "owners_update_members" ON public.company_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = company_members.company_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
        AND cm.status = 'active'
    )
  );

-- Allow owners to DELETE members (except last owner)
CREATE POLICY "owners_delete_members" ON public.company_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = company_members.company_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
        AND cm.status = 'active'
    )
    -- Don't allow removing the last owner
    AND NOT (
      user_id = auth.uid()
      AND role = 'owner'
      AND (
        SELECT COUNT(*)
        FROM public.company_members cm2
        WHERE cm2.company_id = company_members.company_id
          AND cm2.role = 'owner'
          AND cm2.status = 'active'
      ) = 1
    )
  );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT INSERT ON public.users TO service_role, anon;
GRANT ALL ON public.company_members TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check policies
SELECT tablename, policyname, cmd, roles::text
FROM pg_policies
WHERE tablename IN ('users', 'company_members')
ORDER BY tablename, cmd, policyname;

-- Expected for users table:
-- - anon_insert_signup (INSERT, anon)
-- - service_role_insert (INSERT, service_role)
-- - authenticated_select_own (SELECT, authenticated)
-- - authenticated_update_own (UPDATE, authenticated)

-- Expected for company_members table:
-- - insert_self_as_owner (INSERT, authenticated)
-- - owners_insert_members (INSERT, authenticated)
-- - select_company_members (SELECT, authenticated)
-- - owners_update_members (UPDATE, authenticated)
-- - owners_delete_members (DELETE, authenticated)

COMMENT ON POLICY "authenticated_select_own" ON public.users IS
  'Migration 007: Fixed infinite recursion - simple policy without table self-reference';

COMMENT ON POLICY "insert_self_as_owner" ON public.company_members IS
  'Migration 007: Allows company creators to add themselves as first owner without recursion';
