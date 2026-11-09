import { cacheLife, cacheTag } from "next/cache";
import { DEFAULT_ACCENT, normalizeHex } from "@/lib/color";
import { demoCatalog } from "@/lib/demo-data";
import { toCents } from "@/lib/money";
import { createPublicSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import type { Catalog, Category, Product, ShopSettings } from "@/lib/types";

export const CATALOG_CACHE_TAG = "catalog";

type DbShopSettingsRow = {
  id: string;
  shop_name: string;
  description: string | null;
  logo_url: string | null;
  whatsapp_number: string | null;
  currency_code: string;
  accent_color: string | null;
  updated_at: string;
};

type DbCategoryRow = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type DbProductRow = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: string | number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const fallbackSettings: ShopSettings = {
  id: "00000000-0000-4000-8000-000000000001",
  shopName: "ShopLink Store",
  description: "Browse our products and place your order directly on WhatsApp.",
  logoUrl: null,
  whatsappNumber: null,
  currencyCode: "MYR",
  accentColor: DEFAULT_ACCENT,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function mapSettings(row: DbShopSettingsRow | null): ShopSettings {
  if (!row) return fallbackSettings;
  return {
    id: row.id,
    shopName: row.shop_name || "ShopLink Store",
    description: row.description ?? "",
    logoUrl: row.logo_url ?? null,
    whatsappNumber: row.whatsapp_number ?? null,
    currencyCode: (row.currency_code || "MYR").toUpperCase(),
    accentColor: normalizeHex(row.accent_color),
    updatedAt: row.updated_at,
  };
}

function mapCategory(row: DbCategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sort_order ?? 0,
  };
}

function mapProduct(row: DbProductRow): Product {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description ?? "",
    priceCents: toCents(row.price),
    imageUrl: row.image_url ?? null,
    isAvailable: Boolean(row.is_available),
    sortOrder: row.sort_order ?? 0,
  };
}

/**
 * Cached public catalog read. Safe to call in server components; invalidated
 * immediately via `updateTag(CATALOG_CACHE_TAG)` when an admin mutates data.
 */
export async function getPublicCatalog(): Promise<Catalog> {
  "use cache";
  cacheTag(CATALOG_CACHE_TAG);
  cacheLife("minutes");

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return demoCatalog;
  }

  try {
    const [settingsRes, categoriesRes, productsRes] = await Promise.all([
      supabase.from("shop_settings").select("*").limit(1).maybeSingle<DbShopSettingsRow>(),
      supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true })
        .returns<DbCategoryRow[]>(),
      supabase
        .from("products")
        .select("*")
        .eq("is_available", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .returns<DbProductRow[]>(),
    ]);

    if (settingsRes.error || categoriesRes.error || productsRes.error) {
      return {
        settings: fallbackSettings,
        categories: [],
        products: [],
        source: "supabase",
        error: "Unable to load catalog from the database. Ensure the SQL migration has been applied.",
      };
    }

    return {
      settings: mapSettings(settingsRes.data),
      categories: (categoriesRes.data ?? []).map(mapCategory),
      products: (productsRes.data ?? []).map(mapProduct),
      source: "supabase",
    };
  } catch {
    return {
      settings: fallbackSettings,
      categories: [],
      products: [],
      source: "supabase",
      error: "Unable to reach the catalog database right now. Please try again shortly.",
    };
  }
}

/**
 * Uncached fresh catalog lookup used right before generating a WhatsApp order
 * so prices and availability are always verified against the live database.
 */
export async function getFreshPublicCatalog(): Promise<Catalog> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return demoCatalog;
  }

  const [settingsRes, categoriesRes, productsRes] = await Promise.all([
    supabase.from("shop_settings").select("*").limit(1).maybeSingle<DbShopSettingsRow>(),
    supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .returns<DbCategoryRow[]>(),
    supabase
      .from("products")
      .select("*")
      .eq("is_available", true)
      .order("sort_order", { ascending: true })
      .returns<DbProductRow[]>(),
  ]);

  if (settingsRes.error || categoriesRes.error || productsRes.error) {
    throw new Error("Could not verify current catalog prices and availability.");
  }

  return {
    settings: mapSettings(settingsRes.data),
    categories: (categoriesRes.data ?? []).map(mapCategory),
    products: (productsRes.data ?? []).map(mapProduct),
    source: "supabase",
  };
}

/**
 * Fetch a single product for the public detail page.
 */
export async function getPublicProductById(
  id: string,
): Promise<{ catalog: Catalog; product: Product | null; category: Category | null }> {
  const catalog = await getPublicCatalog();
  const product = catalog.products.find((p) => p.id === id) ?? null;
  const category =
    product?.categoryId ? (catalog.categories.find((c) => c.id === product.categoryId) ?? null) : null;
  return { catalog, product, category };
}

/**
 * Authenticated admin read that returns ALL products (including unavailable/unpublished ones).
 */
export async function getAdminCatalogData(): Promise<{
  settings: ShopSettings;
  categories: Category[];
  products: Product[];
  error?: string;
}> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return {
      settings: demoCatalog.settings,
      categories: demoCatalog.categories,
      products: demoCatalog.products,
      error: "Supabase is not configured. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const [settingsRes, categoriesRes, productsRes] = await Promise.all([
    supabase.from("shop_settings").select("*").limit(1).maybeSingle<DbShopSettingsRow>(),
    supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .returns<DbCategoryRow[]>(),
    supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .returns<DbProductRow[]>(),
  ]);

  if (settingsRes.error || categoriesRes.error || productsRes.error) {
    return {
      settings: fallbackSettings,
      categories: [],
      products: [],
      error: "Database tables could not be loaded. Make sure you ran the SQL migration in Supabase.",
    };
  }

  return {
    settings: mapSettings(settingsRes.data),
    categories: (categoriesRes.data ?? []).map(mapCategory),
    products: (productsRes.data ?? []).map(mapProduct),
  };
}

