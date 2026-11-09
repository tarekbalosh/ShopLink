import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  FolderKanban,
  MessageCircle,
  Package,
  Plus,
  Settings,
  TriangleAlert,
} from "lucide-react";
import { requireAdminPage } from "@/lib/auth";
import { getAdminCatalogData } from "@/lib/data";
import { isValidWhatsAppNumber } from "@/lib/whatsapp";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Admin Overview",
};

export default function AdminOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-stone-100 p-6">
          <div className="mx-auto max-w-5xl space-y-4">
            <div className="h-10 w-48 animate-pulse rounded-xl bg-stone-200" />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="h-28 animate-pulse rounded-2xl bg-white" />
              <div className="h-28 animate-pulse rounded-2xl bg-white" />
              <div className="h-28 animate-pulse rounded-2xl bg-white" />
            </div>
          </div>
        </div>
      }
    >
      <AdminOverviewContent />
    </Suspense>
  );
}

async function AdminOverviewContent() {
  const admin = await requireAdminPage();
  const { settings, categories, products, error } = await getAdminCatalogData();

  const availableCount = products.filter((p) => p.isAvailable).length;
  const hiddenCount = products.length - availableCount;
  const whatsappOk = isValidWhatsAppNumber(settings.whatsappNumber);

  return (
    <AdminShell adminEmail={admin.email} shopName={settings.shopName}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Dashboard Overview</h1>
            <p className="mt-0.5 text-sm text-stone-600">
              Manage your catalog, categories, and WhatsApp order settings.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/products"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-stone-900 px-4 text-xs font-semibold text-white hover:bg-stone-800"
            >
              <Plus className="size-4" aria-hidden />
              Manage Products
            </Link>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 text-xs font-semibold text-stone-800 hover:bg-stone-50"
            >
              Preview Storefront
              <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            {error}
          </div>
        )}

        {!whatsappOk && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
          >
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden />
              <div>
                <p className="font-semibold">WhatsApp ordering number is not set</p>
                <p className="mt-0.5 text-xs text-amber-900">
                  Customers cannot open a WhatsApp conversation until you set a digits-only international number in Shop Settings (e.g.{" "}
                  <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">60123456789</code>).
                </p>
              </div>
            </div>
            <Link
              href="/admin/settings"
              className="inline-flex h-9 shrink-0 items-center rounded-full bg-amber-900 px-4 text-xs font-semibold text-white hover:bg-amber-800"
            >
              Configure WhatsApp
            </Link>
          </div>
        )}

        {/* Overview cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Total Products
              </span>
              <Package className="size-5 text-stone-400" aria-hidden />
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-stone-900">{products.length}</p>
            <p className="mt-1 text-xs text-stone-600">
              {availableCount} published · {hiddenCount} hidden
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Categories
              </span>
              <FolderKanban className="size-5 text-stone-400" aria-hidden />
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-stone-900">{categories.length}</p>
            <p className="mt-1 text-xs text-stone-600">
              Used to filter products on the storefront
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                WhatsApp Channel
              </span>
              <MessageCircle className="size-5 text-stone-400" aria-hidden />
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-lg font-bold text-stone-900">
              {whatsappOk ? (
                <>
                  <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
                  <span className="font-mono">{settings.whatsappNumber}</span>
                </>
              ) : (
                <span className="text-amber-700">Not configured</span>
              )}
            </p>
            <p className="mt-1 text-xs text-stone-600">
              Currency: <strong>{settings.currencyCode}</strong>
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/admin/products"
            className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:shadow"
          >
            <Package className="size-6 text-teal-700" aria-hidden />
            <h2 className="mt-3 text-base font-semibold text-stone-900 group-hover:underline">
              Products
            </h2>
            <p className="mt-1 text-xs text-stone-600">
              Add products, upload photos, update prices, or hide out-of-stock items.
            </p>
          </Link>

          <Link
            href="/admin/categories"
            className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:shadow"
          >
            <FolderKanban className="size-6 text-teal-700" aria-hidden />
            <h2 className="mt-3 text-base font-semibold text-stone-900 group-hover:underline">
              Categories
            </h2>
            <p className="mt-1 text-xs text-stone-600">
              Create and sort product categories for easy customer browsing.
            </p>
          </Link>

          <Link
            href="/admin/settings"
            className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:shadow"
          >
            <Settings className="size-6 text-teal-700" aria-hidden />
            <h2 className="mt-3 text-base font-semibold text-stone-900 group-hover:underline">
              Shop Settings
            </h2>
            <p className="mt-1 text-xs text-stone-600">
              Set your shop name, logo, WhatsApp number, currency, and brand color.
            </p>
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}

