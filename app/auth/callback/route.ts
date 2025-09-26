import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/auth/profile-setup'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if user profile exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existingProfile) {
        // No profile exists, redirect to profile setup page
        return NextResponse.redirect(`${origin}/auth/profile-setup`)
      }

      // User is verified and has profile, redirect to dashboard
      return NextResponse.redirect(`${origin}/platform/dashboard`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`)
}