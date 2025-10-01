/**
 * Supabase Client Initialization
 *
 * Creates browser-side Supabase client for authentication and data queries.
 * This client respects Row Level Security (RLS) policies.
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
