import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldAlert, Store, Wrench } from "lucide-react";
import { getAdminAuthState } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Admin Sign In",
};

export default function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-stone-100 p-4">
          <div className="h-96 w-full max-w-md animate-pulse rounded-2xl bg-white" />
        </div>
      }
    >
      <AdminLoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminLoginContent({
  searchParams,
}: {
  searchParams: PageProps<"/admin/login">["searchParams"];
}) {
  const [authState, resolvedSearch] = await Promise.all([
    getAdminAuthState(),
    searchParams,
  ]);

  if (authState.status === "authorized") {
    redirect("/admin");
  }

  const unconfigured = authState.status === "unconfigured";
  const forbidden =
    authState.status === "forbidden" || resolvedSearch.reason === "forbidden";

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
                Sign in with an authorized shop owner account
              </p>
            </div>
          </div>

          {unconfigured && (
            <div
              role="status"
              className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-950"
            >
              <p className="flex items-center gap-1.5 font-semibold">
                <Wrench className="size-4 text-amber-700" aria-hidden />
                Supabase environment variables required
              </p>
              <p className="mt-1 leading-relaxed text-amber-900">
                Copy <code className="rounded bg-amber-100 px-1 py-0.5">.env.example</code> to{" "}
                <code className="rounded bg-amber-100 px-1 py-0.5">.env.local</code>, add your{" "}
                <code className="rounded bg-amber-100 px-1 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code className="rounded bg-amber-100 px-1 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,
                run the SQL migration, and create your first admin user as documented in the README.
              </p>
            </div>
          )}

          {forbidden && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-900"
            >
              <p className="flex items-center gap-1.5 font-semibold">
                <ShieldAlert className="size-4 text-red-700" aria-hidden />
                Account not authorized as admin
              </p>
              <p className="mt-1 leading-relaxed">
                Being signed in is not enough — your user ID must also be listed in{" "}
                <code className="rounded bg-red-100 px-1 py-0.5">public.admin_users</code>. See the README
                for the one-line SQL command to authorize the first admin.
              </p>
            </div>
          )}

          <div className="mt-6">
            <LoginForm disabled={unconfigured} />
          </div>

          <p className="mt-6 border-t border-stone-100 pt-4 text-center text-xs text-stone-500">
            Public admin self-registration is disabled for security. Admins are provisioned in Supabase Auth and added to{" "}
            <code className="font-mono text-stone-700">public.admin_users</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

