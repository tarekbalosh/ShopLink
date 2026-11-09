/**
 * Domain types used across the app. Money is always represented in integer
 * minor units ("cents") to avoid floating-point rounding errors.
 */

export type ShopSettings = {
  id: string;
  shopName: string;
  description: string;
  logoUrl: string | null;
  /** International format, digits only, e.g. "60123456789". */
  whatsappNumber: string | null;
  /** ISO 4217 code, e.g. "MYR". */
  currencyCode: string;
  /** Hex color, e.g. "#0f766e". */
  accentColor: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
};

export type Product = {
  id: string;
  categoryId: string | null;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  isAvailable: boolean;
  sortOrder: number;
};

export type Catalog = {
  settings: ShopSettings;
  categories: Category[];
  products: Product[];
  /** "demo" when Supabase is not configured and built-in demo content is shown. */
  source: "supabase" | "demo";
  /** Set when the catalog could not be loaded (a safe, user-facing message). */
  error?: string;
};

