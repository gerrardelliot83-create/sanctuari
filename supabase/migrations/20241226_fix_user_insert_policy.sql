-- Fix RLS policy for user signup
-- This migration adds the missing INSERT policy for the users table

-- Add INSERT policy for users table to allow profile creation during signup
CREATE POLICY "Users can create own profile during signup" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Also ensure that the INSERT policy allows new users to insert their profile
-- regardless of existing data (needed for initial signup)
DROP POLICY IF EXISTS "Users can create own profile during signup" ON public.users;

CREATE POLICY "Users can create own profile during signup" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);