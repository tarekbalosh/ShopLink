import type { Metadata } from "next";
import { getPublicCatalog } from "@/lib/data";
import { CatalogBrowser } from "@/components/storefront/catalog-browser";
import { StoreShell } from "@/components/storefront/store-shell";

export async function generateMetadata(): Promise<Metadata> {
  const catalog = await getPublicCatalog();
  return {
    title: catalog.settings.shopName,
    description:
      catalog.settings.description ||
      `Browse products from ${catalog.settings.shopName} and order via WhatsApp.`,
  };
}

export default async function StorefrontHomePage() {
  const catalog = await getPublicCatalog();
  const { settings, categories, products } = catalog;

  return (
    <StoreShell catalog={catalog}>
      <section className="mb-6 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-7">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-ink">
            Product Catalog
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            {settings.shopName}
          </h1>
          {settings.description && (
            <p className="mt-2 text-sm leading-relaxed text-stone-600 sm:text-base">
              {settings.description}
            </p>
          )}
        </div>
      </section>

      <CatalogBrowser
        products={products}
        categories={categories}
        currencyCode={settings.currencyCode}
      />
    </StoreShell>
  );
}
