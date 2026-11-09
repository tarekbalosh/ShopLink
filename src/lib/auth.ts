import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminIdentity = {
  id: string;
  email: string;
};

export type AdminAuthState =
  | { status: "unconfigured" }
  | { status: "unauthenticated" }
  | { status: "forbidden"; email: string }
  | { status: "authorized"; admin: AdminIdentity };

/**
 * Verifies both authentication (via `supabase.auth.getUser()`) AND explicit
 * admin authorization (via `public.admin_users` allowlist).
 * Never assumes every authenticated user is an admin.
 */
export async function getAdminAuthState(): Promise<AdminAuthState> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { status: "unconfigured" };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: "unauthenticated" };
  }

  const { data: allowlistRow, error: allowlistError } = await supabase
    .from("admin_users")
    .select("user_id, email")
    .eq("user_id", user.id)
    .maybeSingle<{ user_id: string; email: string }>();

  if (allowlistError || !allowlistRow) {
    return {
      status: "forbidden",
      email: user.email ?? "unknown",
    };
  }

  return {
    status: "authorized",
    admin: {
      id: user.id,
      email: user.email ?? allowlistRow.email,
    },
  };
}

/**
 * Guard for protected admin server components. Redirects unauthenticated or
 * unauthorized users to `/admin/login`.
 */
export async function requireAdminPage(): Promise<AdminIdentity> {
  const state = await getAdminAuthState();
  if (state.status === "unconfigured") {
    redirect("/admin/login?reason=unconfigured");
  }
  if (state.status === "unauthenticated") {
    redirect("/admin/login");
  }
  if (state.status === "forbidden") {
    redirect("/admin/login?reason=forbidden");
  }
  return state.admin;
}

/**
 * Guard for admin Server Actions and Route Handlers.
 * Returns an authorized server Supabase client + admin identity, or throws a safe error.
 */
export async function requireAdminMutation() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authentication required. Please sign in as an admin.");
  }

  const { data: allowlistRow, error: allowlistError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle<{ user_id: string }>();

  if (allowlistError || !allowlistRow) {
    throw new Error("Access denied. Your account is not authorized as a shop admin.");
  }

  return {
    supabase,
    admin: {
      id: user.id,
      email: user.email ?? "",
    },
  };
}

