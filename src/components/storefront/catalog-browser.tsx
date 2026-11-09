"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { PackageOpen, Search, X } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "./product-card";

type Props = {
  products: Product[];
  categories: Category[];
  currencyCode: string;
};

const ALL = "__all__";

function normalize(value: string): string {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Client-side search and category filtering. A small shop's catalog is small
 * enough to filter in the browser, which keeps the page fully cacheable.
 */
export function CatalogBrowser({ products, categories, currencyCode }: Props) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const deferredQuery = useDeferredValue(query);

  const categoryNames = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  // Only show categories that actually contain products.
  const visibleCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) if (p.categoryId) counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
    return categories.filter((c) => counts.has(c.id)).map((c) => ({ ...c, count: counts.get(c.id) ?? 0 }));
  }, [categories, products]);

  const filtered = useMemo(() => {
    const q = normalize(deferredQuery.trim());
    return products.filter((p) => {
      if (categoryId !== ALL && p.categoryId !== categoryId) return false;
      if (!q) return true;
      return normalize(p.name).includes(q) || normalize(p.description).includes(q);
    });
  }, [products, categoryId, deferredQuery]);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
        <PackageOpen className="size-10 text-stone-400" aria-hidden />
        <h2 className="mt-4 text-lg font-semibold text-stone-900">No products yet</h2>
        <p className="mt-1 max-w-sm text-sm text-stone-600">
          This shop hasn&apos;t published any products. Please check back soon.
        </p>
      </div>
    );
  }

  const activeCategoryName = categoryId === ALL ? null : categoryNames.get(categoryId);

  return (
    <section aria-labelledby="catalog-heading" className="flex flex-col gap-5">
      <h2 id="catalog-heading" className="sr-only">
        Products
      </h2>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400" aria-hidden />
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>
          <input
            id="product-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            autoComplete="off"
            className="h-12 w-full rounded-full border border-stone-200 bg-white pl-12 pr-12 text-base text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-stone-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
              aria-label="Clear search"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>

        {visibleCategories.length > 0 && (
          <div
            role="toolbar"
            aria-label="Filter by category"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
          >
            <CategoryChip active={categoryId === ALL} onClick={() => setCategoryId(ALL)} label="All" count={products.length} />
            {visibleCategories.map((c) => (
              <CategoryChip
                key={c.id}
                active={categoryId === c.id}
                onClick={() => setCategoryId(c.id)}
                label={c.name}
                count={c.count}
              />
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-stone-600" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "product" : "products"}
        {activeCategoryName ? ` in ${activeCategoryName}` : ""}
        {deferredQuery.trim() ? ` matching “${deferredQuery.trim()}”` : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
          <Search className="size-8 text-stone-400" aria-hidden />
          <p className="mt-3 font-medium text-stone-900">No matching products</p>
          <p className="mt-1 text-sm text-stone-600">Try a different search or category.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategoryId(ALL);
            }}
            className="mt-4 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product, index) => (
            <li key={product.id} className="flex">
              <div className="flex w-full flex-col [&>article]:flex-1">
                <ProductCard
                  product={product}
                  categoryName={product.categoryId ? (categoryNames.get(product.categoryId) ?? null) : null}
                  currencyCode={currencyCode}
                  priority={index < 4}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition ${
        active
          ? "border-transparent bg-accent text-accent-fg shadow-sm"
          : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50"
      }`}
    >
      {label}
      <span className={`text-xs tabular-nums ${active ? "opacity-80" : "text-stone-400"}`}>{count}</span>
    </button>
  );
}

