/**
 * Middleware: Protected Routes
 * Purpose: Auth guard for protected pages
 * Checks: Authentication status and onboarding completion
 */

import { createClient } from '@sanctuari/database/lib/middleware';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { supabase, response } = createClient(request);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected paths that require authentication
  const protectedPaths = ['/dashboard', '/rfq', '/bids', '/settings', '/profile'];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Onboarding path
  const isOnboardingPath = request.nextUrl.pathname.startsWith('/onboarding');

  // Auth paths (login, signup, etc.)
  const authPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // If accessing protected path without session, redirect to login
  if (!session && isProtectedPath) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If accessing protected path or onboarding with session, check onboarding status
  if (session && (isProtectedPath || isOnboardingPath)) {
    const { data: user } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .single();

    // If onboarding not completed and trying to access protected paths, redirect to onboarding
    if (user && !user.onboarding_completed && isProtectedPath) {
      return NextResponse.redirect(
        new URL('/onboarding/company', request.url)
      );
    }

    // If onboarding completed and trying to access onboarding, redirect to dashboard
    if (user && user.onboarding_completed && isOnboardingPath) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (session && isAuthPath) {
    const { data: user } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .single();

    if (user && user.onboarding_completed) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/rfq/:path*',
    '/bids/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/onboarding/:path*',
  ],
};
