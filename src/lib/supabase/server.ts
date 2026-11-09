import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseEnv } from "@/lib/env";

/**
 * Cookieless anonymous Supabase client safe to use inside `"use cache"` scopes
 * for reading public storefront data (governed by anon RLS policies).
 */
export function createPublicSupabaseClient() {
  const env = getPublicSupabaseEnv();
  if (!env) return null;

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Cookie-aware server Supabase client for authenticated admin pages and
 * Server Actions. Must only be called at request time (outside `"use cache"`).
 */
export async function createServerSupabaseClient() {
  const env = getPublicSupabaseEnv();
  if (!env) return null;

  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component where setting cookies is not allowed;
          // proxy.ts refreshes session cookies on requests.
        }
      },
    },
  });
}

