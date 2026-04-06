import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Returns a Supabase client authenticated with the current user's Clerk JWT */
export function createSupabaseClient(token: string) {
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

/** Returns an unauthenticated Supabase client for server-side API routes */
export function getSupabase() {
  return createClient(url, anon);
}
