/**
 * Authentication Helper Functions
 * Purpose: Supabase auth operations wrapper
 * Used in: All authentication flows
 *
 * Security: Uses Supabase Auth with RLS policies
 */

import { createClient } from './client';

/**
 * Sign up a new user with email and password
 * Creates user in auth.users and public.users tables
 */
export async function signUp(email, password, fullName = null) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_PLATFORM_URL}/auth/callback`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        onboarding_completed: false,
        role: 'client',
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error('Failed to create user profile');
      }
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email, password) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error };
  }
}

/**
 * Send password reset email
 */
export async function resetPasswordForEmail(email) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_PLATFORM_URL}/auth/reset-password`,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Get current authenticated user
 */
export async function getUser() {
  const supabase = createClient();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw error;

    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

/**
 * Get current session
 */
export async function getSession() {
  const supabase = createClient();

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;

    return { session, error: null };
  } catch (error) {
    return { session: null, error };
  }
}

/**
 * Get user profile from public.users table
 */
export async function getUserProfile(userId) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return { profile: data, error: null };
  } catch (error) {
    return { profile: null, error };
  }
}

/**
 * Check if user has completed onboarding
 */
export async function checkOnboardingStatus(userId) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return { completed: data?.onboarding_completed || false, error: null };
  } catch (error) {
    return { completed: false, error };
  }
}

/**
 * Mark onboarding as completed
 */
export async function completeOnboarding(userId) {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('users')
      .update({ onboarding_completed: true })
      .eq('id', userId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error };
  }
}
