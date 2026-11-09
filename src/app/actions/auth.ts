"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  verifyAdminPassword,
} from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SignInActionResult = {
  ok: false;
  error: string;
};

export async function signInAdminAction(formData: FormData): Promise<SignInActionResult> {
  const password = String(formData.get("password") ?? "");

  if (!password.trim()) {
    return {
      ok: false,
      error: "الرجاء إدخال كلمة السر / Please enter the password.",
    };
  }

  if (!verifyAdminPassword(password)) {
    return {
      ok: false,
      error: "كلمة السر غير صحيحة / Invalid password.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  redirect("/admin");
}

export async function signOutAdminAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);

  const supabase = await createServerSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}
