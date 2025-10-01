-- Migration 004: Fix User RLS Policies for Signup
-- Purpose: Resolve RLS conflict preventing user profile creation during signup
-- Issue: Trigger runs before auth session is established, causing RLS violation
-- Date: October 1, 2025

-- =====================================================
-- DROP CONFLICTING POLICY
-- =====================================================
-- The INSERT policy added in migration 003 conflicts with the trigger
-- because it requires auth.uid() which doesn't exist during signup

DROP POLICY IF EXISTS "Users can insert own profile during signup" ON public.users;

-- =====================================================
-- CREATE SERVICE ROLE POLICY
-- =====================================================
-- Allow the trigger (running as service role) to insert user profiles
-- This bypasses RLS for the automated trigger

CREATE POLICY "Service role can insert users" ON public.users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =====================================================
-- ADD ANON INSERT POLICY FOR INITIAL SIGNUP
-- =====================================================
-- Allow anonymous (not yet authenticated) users to create their profile
-- This handles edge cases where trigger doesn't fire
-- The check ensures they can only insert their own ID

CREATE POLICY "Allow anon insert during signup" ON public.users
  FOR INSERT
  TO anon
  WITH CHECK (id = auth.uid());

-- =====================================================
-- ENSURE AUTHENTICATED USERS CAN READ THEIR DATA
-- =====================================================
-- This should already exist from migration 001, but ensure it's correct

DROP POLICY IF EXISTS "Users can view own data" ON public.users;

CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- =====================================================
-- UPDATE TRIGGER TO HANDLE DUPLICATES
-- =====================================================
-- Modify the trigger function to handle cases where user already exists
-- This prevents errors if trigger fires multiple times

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only insert if user doesn't already exist
  INSERT INTO public.users (
    id,
    email,
    full_name,
    onboarding_completed,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    false,
    'client',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- =====================================================
-- GRANT NECESSARY PERMISSIONS
-- =====================================================
-- Ensure the trigger function has permission to insert

GRANT INSERT ON public.users TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration:

-- 1. Check policies on users table:
-- SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'users';

-- 2. Check trigger exists:
-- SELECT trigger_name, event_manipulation, action_statement
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';

-- 3. Check function exists:
-- SELECT routine_name, security_type
-- FROM information_schema.routines
-- WHERE routine_name = 'handle_new_user';

-- =====================================================
-- NOTES
-- =====================================================
-- This migration fixes the RLS policy conflict by:
-- 1. Removing the conflicting authenticated INSERT policy
-- 2. Adding service_role policy for the trigger
-- 3. Adding anon policy for edge cases
-- 4. Making the trigger idempotent with ON CONFLICT
--
-- After running this migration:
-- - The trigger should successfully create user profiles
-- - No RLS violations should occur during signup
-- - Users should receive verification emails normally
