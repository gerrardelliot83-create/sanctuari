/**
 * Route: Auth Callback
 * Purpose: Handle OAuth and email verification callbacks from Supabase
 * Called by: Supabase Auth (email verification, password reset)
 */

import { createClient } from '@sanctuari/database/lib/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = createClient();

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user and check onboarding status
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        // Redirect based on onboarding status
        if (profile && !profile.onboarding_completed) {
          return NextResponse.redirect(
            new URL('/onboarding/company', requestUrl.origin)
          );
        }

        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
    }
  }

  // Return to login if something went wrong
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
}
