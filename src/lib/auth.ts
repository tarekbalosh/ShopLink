import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const ADMIN_SESSION_COOKIE = "shoplink_admin_session";

export type AdminIdentity = {
  id: string;
  email: string;
};

export type AdminAuthState =
  | { status: "unauthenticated" }
  | { status: "forbidden"; email: string }
  | { status: "authorized"; admin: AdminIdentity };

/**
 * Normalizes Arabic-Indic (`٠-٩`) and Eastern Arabic (`۰-۹`) digits into ASCII `0-9`.
 */
export function normalizePasswordDigits(input: string): string {
  return input
    .trim()
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

function getExpectedAdminPassword(): string {
  const configured = process.env.ADMIN_PASSWORD?.trim();
  return configured ? normalizePasswordDigits(configured) : "123";
}

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET?.trim() || "shoplink-local-admin-secret-v1";
}

export function createAdminSessionToken(): string {
  const payload = "shoplink-admin:authorized";
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");
  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const expected = createAdminSessionToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function verifyAdminPassword(input: string): boolean {
  const normalized = normalizePasswordDigits(input);
  const expected = getExpectedAdminPassword();
  const a = Buffer.from(normalized);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Checks if the current request is authorized via the password session cookie
 * OR via an allowlisted Supabase Auth user (`public.admin_users`).
 */
export async function getAdminAuthState(): Promise<AdminAuthState> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (verifyAdminSessionToken(sessionToken)) {
    return {
      status: "authorized",
      admin: {
        id: "local-admin",
        email: "Shop Owner",
      },
    };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { status: "unauthenticated" };
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
 * Returns an optional server Supabase client + admin identity, or throws a safe error.
 */
export async function requireAdminMutation() {
  const state = await getAdminAuthState();
  if (state.status !== "authorized") {
    throw new Error("Authentication required. Please sign in as an admin.");
  }

  const supabase = await createServerSupabaseClient();

  return {
    supabase,
    admin: state.admin,
  };
}
