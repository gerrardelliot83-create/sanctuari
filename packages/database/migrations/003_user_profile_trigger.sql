-- Migration 003: User Profile Auto-Creation Trigger
-- Purpose: Automatically create user profile when new user signs up
-- This solves the 401 RLS error during signup by using a secure trigger
-- Date: October 1, 2025

-- =====================================================
-- FUNCTION: Handle New User Signup
-- =====================================================
-- This function automatically creates a profile in public.users
-- when a new user signs up in auth.users
-- SECURITY DEFINER allows it to bypass RLS policies

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
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
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGER: Auto-create user profile on signup
-- =====================================================
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires AFTER a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- RLS POLICY: Allow users to insert their own profile
-- =====================================================
-- This is a fallback in case the trigger doesn't fire
-- or if profile needs to be re-created

CREATE POLICY "Users can insert own profile during signup" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- To verify this migration worked:
-- 1. Check that the function exists:
--    SELECT routine_name FROM information_schema.routines
--    WHERE routine_name = 'handle_new_user';
--
-- 2. Check that the trigger exists:
--    SELECT trigger_name FROM information_schema.triggers
--    WHERE trigger_name = 'on_auth_user_created';
--
-- 3. Test by signing up a new user
-- =====================================================

-- Add comment to track migration
COMMENT ON FUNCTION public.handle_new_user() IS
  'Migration 003: Auto-creates user profile in public.users when auth.users record is created';
