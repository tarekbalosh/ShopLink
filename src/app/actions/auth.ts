"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export type SignInActionResult = {
  ok: false;
  error: string;
};

export async function signInAdminAction(formData: FormData): Promise<SignInActionResult> {
  const parsed = signInSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please enter your email and password.",
    };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return {
      ok: false,
      error: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return {
      ok: false,
      error: "Invalid email or password.",
    };
  }

  // Verify explicit admin authorization right away.
  const { data: allowlistRow, error: allowlistError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle<{ user_id: string }>();

  if (allowlistError || !allowlistRow) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error:
        "This account is not in the admin allowlist (public.admin_users). Grant admin access via the Supabase SQL Editor first.",
    };
  }

  redirect("/admin");
}

export async function signOutAdminAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}

