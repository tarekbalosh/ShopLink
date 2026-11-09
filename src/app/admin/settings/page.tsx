import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth";
import { getAdminCatalogData } from "@/lib/data";
import { AdminShell } from "@/components/admin/admin-shell";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = {
  title: "Shop Settings",
};

export default function AdminSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-stone-100 p-6">
          <div className="mx-auto max-w-5xl space-y-4">
            <div className="h-10 w-48 animate-pulse rounded-xl bg-stone-200" />
            <div className="h-96 animate-pulse rounded-2xl bg-white" />
          </div>
        </div>
      }
    >
      <AdminSettingsContent />
    </Suspense>
  );
}

async function AdminSettingsContent() {
  const admin = await requireAdminPage();
  const { settings } = await getAdminCatalogData();

  return (
    <AdminShell adminEmail={admin.email} shopName={settings.shopName}>
      <SettingsForm settings={settings} />
    </AdminShell>
  );
}

