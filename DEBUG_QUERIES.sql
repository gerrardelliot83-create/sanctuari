-- Debug Queries for Company Onboarding Issue
-- Run these in Supabase SQL Editor to diagnose the problem

-- =====================================================
-- 1. Check RLS policies on users table
-- =====================================================
SELECT
  policyname,
  cmd,
  roles::text,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- Expected policies:
-- - Service role can insert users (INSERT, service_role)
-- - Allow anon insert during signup (INSERT, anon)
-- - Users can view own data (SELECT, authenticated)
-- - Users can update own data (UPDATE, authenticated)

-- =====================================================
-- 2. Check if user profile exists
-- =====================================================
-- Replace USER_ID with actual user ID: a45b3f5c-5b0b-49ea-934a-05f69ac756ba
SELECT
  id,
  email,
  onboarding_completed,
  created_at
FROM public.users
WHERE id = 'a45b3f5c-5b0b-49ea-934a-05f69ac756ba';

-- =====================================================
-- 3. Test if authenticated user can SELECT their own data
-- =====================================================
-- This simulates what happens when the app queries the users table
SET request.jwt.claim.sub = 'a45b3f5c-5b0b-49ea-934a-05f69ac756ba';
SET request.jwt.claim.role = 'authenticated';
SET role authenticated;

SELECT id, email, onboarding_completed
FROM public.users
WHERE id = 'a45b3f5c-5b0b-49ea-934a-05f69ac756ba';

-- Reset role
RESET role;

-- =====================================================
-- 4. Check if there are any active triggers causing issues
-- =====================================================
SELECT
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users';

-- =====================================================
-- 5. Check table permissions
-- =====================================================
SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'users'
  AND grantee IN ('anon', 'authenticated', 'service_role');

-- =====================================================
-- 6. Try to manually insert a company (as admin)
-- =====================================================
-- This bypasses RLS to test if the basic INSERT works
INSERT INTO public.companies (
  name,
  industry,
  created_by
) VALUES (
  'Test Company Manual',
  'Testing',
  'a45b3f5c-5b0b-49ea-934a-05f69ac756ba'
) RETURNING id, name, created_by;

-- If this succeeds, note the company ID

-- =====================================================
-- 7. Try to manually insert company_member (as admin)
-- =====================================================
-- Replace COMPANY_ID with the ID from step 6
INSERT INTO public.company_members (
  company_id,
  user_id,
  role,
  invited_by,
  joined_at,
  status
) VALUES (
  'COMPANY_ID_FROM_STEP_6',
  'a45b3f5c-5b0b-49ea-934a-05f69ac756ba',
  'owner',
  'a45b3f5c-5b0b-49ea-934a-05f69ac756ba',
  NOW(),
  'active'
) RETURNING *;

-- =====================================================
-- 8. Check Postgres error logs
-- =====================================================
-- Run this to see recent errors
SELECT
  error_severity,
  message,
  detail,
  hint,
  query
FROM postgres_logs
WHERE error_severity = 'ERROR'
  AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC
LIMIT 10;

-- Note: This table might not exist in all Supabase projects
-- If it fails, check logs through Dashboard → Logs → Postgres Logs
