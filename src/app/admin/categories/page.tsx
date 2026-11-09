import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth";
import { getAdminCatalogData } from "@/lib/data";
import { AdminShell } from "@/components/admin/admin-shell";
import { CategoriesManager } from "@/components/admin/categories-manager";

export const metadata: Metadata = {
  title: "Manage Categories",
};

export default function AdminCategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-stone-100 p-6">
          <div className="mx-auto max-w-5xl space-y-4">
            <div className="h-10 w-48 animate-pulse rounded-xl bg-stone-200" />
            <div className="h-80 animate-pulse rounded-2xl bg-white" />
          </div>
        </div>
      }
    >
      <AdminCategoriesContent />
    </Suspense>
  );
}

async function AdminCategoriesContent() {
  const admin = await requireAdminPage();
  const { settings, categories, products } = await getAdminCatalogData();

  const productCountsByCategory: Record<string, number> = {};
  for (const product of products) {
    if (product.categoryId) {
      productCountsByCategory[product.categoryId] =
        (productCountsByCategory[product.categoryId] ?? 0) + 1;
    }
  }

  return (
    <AdminShell adminEmail={admin.email} shopName={settings.shopName}>
      <CategoriesManager
        categories={categories}
        productCountsByCategory={productCountsByCategory}
      />
    </AdminShell>
  );
}

