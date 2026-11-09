import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Store } from "lucide-react";
import { getAdminAuthState } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Admin Sign In",
};

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-stone-100 p-4">
          <div className="h-72 w-full max-w-md animate-pulse rounded-2xl bg-white" />
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}

async function AdminLoginContent() {
  const authState = await getAdminAuthState();

  if (authState.status === "authorized") {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-stone-100 px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to storefront
        </Link>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-teal-700 text-white">
              <Store className="size-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-900">ShopLink Admin</h1>
              <p className="text-xs text-stone-500">
                Enter the admin password to access the dashboard
              </p>
            </div>
          </div>

          <div className="mt-6">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
