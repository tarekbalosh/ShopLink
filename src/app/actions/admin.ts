"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdminMutation } from "@/lib/auth";
import { isHexColor } from "@/lib/color";
import { SUPPORTED_CURRENCY_CODES } from "@/lib/currencies";
import { CATALOG_CACHE_TAG } from "@/lib/data";
import {
  deleteLocalUploadedImage,
  readLocalCatalog,
  saveLocalUploadedImage,
  writeLocalCatalog,
} from "@/lib/local-store";
import { centsToDecimalString, parsePriceInput } from "@/lib/money";
import { cleanText, isValidWhatsAppNumber, normalizeWhatsAppNumber } from "@/lib/whatsapp";

export type ActionResult = {
  ok: boolean;
  message?: string;
  error?: string;
};

const STORAGE_BUCKET = "shop-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

function extractStoragePathFromPublicUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

async function uploadImageFile(
  supabase: Awaited<ReturnType<typeof requireAdminMutation>>["supabase"],
  file: File,
  folder: "products" | "logos",
): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Unsupported image format. Please upload a JPEG, PNG, WebP, or GIF image.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image file is too large. Maximum size is 5 MB.");
  }

  const ext = extFromMime(file.type);
  if (!supabase) {
    return saveLocalUploadedImage(file, folder, ext);
  }

  const objectPath = `${folder}/${crypto.randomUUID()}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(objectPath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error("Could not upload image. Ensure the `shop-images` Storage bucket and policies exist.");
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

async function deleteStorageObjectIfOwned(
  supabase: Awaited<ReturnType<typeof requireAdminMutation>>["supabase"],
  publicUrl: string | null | undefined,
) {
  if (!supabase) {
    await deleteLocalUploadedImage(publicUrl);
    return;
  }
  const path = extractStoragePathFromPublicUrl(publicUrl);
  if (!path) return;
  await supabase.storage.from(STORAGE_BUCKET).remove([path]);
}

function refreshCatalogCaches(productId?: string) {
  updateTag(CATALOG_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/settings");
  if (productId) {
    revalidatePath(`/products/${productId}`);
  }
}

function slugifyCategoryName(input: string): string {
  const ascii = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return ascii || `category-${Date.now().toString(36)}`;
}

// =============================================================================
// Category Actions
// =============================================================================

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .transform((s) => cleanText(s))
    .pipe(z.string().min(1, "Category name is required.").max(80, "Category name is too long.")),
  slug: z
    .string()
    .optional()
    .transform((s) => (s ? slugifyCategoryName(s) : "")),
  sortOrder: z.coerce.number().int().min(-9999).max(99999).default(0),
});

export async function saveCategoryAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminMutation();

    const rawId = String(formData.get("id") ?? "").trim();
    const parsed = categorySchema.safeParse({
      id: rawId || undefined,
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      sortOrder: formData.get("sortOrder") ?? 0,
    });

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid category data." };
    }

    const { id, name, sortOrder } = parsed.data;
    const slug = parsed.data.slug || slugifyCategoryName(name);

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return {
        ok: false,
        error: "Slug must contain lowercase letters, numbers, and hyphens only.",
      };
    }

    if (!supabase) {
      const local = await readLocalCatalog();
      const duplicate = local.categories.find((c) => c.slug === slug && c.id !== id);
      if (duplicate) {
        return { ok: false, error: "A category with this slug already exists." };
      }
      const nextCategories = id
        ? local.categories.map((c) => (c.id === id ? { ...c, name, slug, sortOrder } : c))
        : [...local.categories, { id: crypto.randomUUID(), name, slug, sortOrder }];
      await writeLocalCatalog({
        settings: local.settings,
        categories: nextCategories,
        products: local.products,
      });
      refreshCatalogCaches();
      return { ok: true, message: id ? "Category updated." : "Category created." };
    }

    if (id) {
      const { error } = await supabase
        .from("categories")
        .update({ name, slug, sort_order: sortOrder })
        .eq("id", id);

      if (error) {
        if (error.code === "23505") {
          return { ok: false, error: "Another category already uses this slug." };
        }
        return { ok: false, error: "Could not update category." };
      }

      refreshCatalogCaches();
      return { ok: true, message: "Category updated." };
    }

    const { error } = await supabase
      .from("categories")
      .insert({ name, slug, sort_order: sortOrder });

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "A category with this slug already exists." };
      }
      return { ok: false, error: "Could not create category." };
    }

    refreshCatalogCaches();
    return { ok: true, message: "Category created." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not save category.",
    };
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminMutation();
    if (!z.string().uuid().safeParse(categoryId).success) {
      return { ok: false, error: "Invalid category ID." };
    }

    if (!supabase) {
      const local = await readLocalCatalog();
      await writeLocalCatalog({
        settings: local.settings,
        categories: local.categories.filter((c) => c.id !== categoryId),
        products: local.products.map((p) =>
          p.categoryId === categoryId ? { ...p, categoryId: null } : p,
        ),
      });
      refreshCatalogCaches();
      return { ok: true, message: "Category deleted." };
    }

    const { error } = await supabase.from("categories").delete().eq("id", categoryId);
    if (error) {
      return { ok: false, error: "Could not delete category." };
    }

    refreshCatalogCaches();
    return { ok: true, message: "Category deleted." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not delete category.",
    };
  }
}

// =============================================================================
// Product Actions
// =============================================================================

const productFieldsSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .transform((s) => cleanText(s))
    .pipe(z.string().min(1, "Product name is required.").max(140, "Product name is too long.")),
  description: z
    .string()
    .optional()
    .transform((s) => (s ? cleanText(s, { multiline: true }) : ""))
    .pipe(z.string().max(2000, "Description must be 2000 characters or fewer.")),
  categoryId: z
    .string()
    .optional()
    .transform((s) => (s && s.trim() ? s.trim() : null))
    .refine((val) => val === null || z.string().uuid().safeParse(val).success, "Invalid category."),
  sortOrder: z.coerce.number().int().min(-9999).max(99999).default(0),
  isAvailable: z.boolean(),
});

export async function saveProductAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminMutation();

    const rawId = String(formData.get("id") ?? "").trim();
    const rawPrice = String(formData.get("price") ?? "").trim();
    const priceCents = parsePriceInput(rawPrice);
    if (priceCents === null) {
      return {
        ok: false,
        error: "Enter a valid non-negative price with up to 2 decimal places (e.g. 12.50).",
      };
    }

    const parsed = productFieldsSchema.safeParse({
      id: rawId || undefined,
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      categoryId: String(formData.get("categoryId") ?? ""),
      sortOrder: formData.get("sortOrder") ?? 0,
      isAvailable: formData.get("isAvailable") === "true" || formData.get("isAvailable") === "on",
    });

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid product data." };
    }

    const { id, name, description, categoryId, sortOrder, isAvailable } = parsed.data;
    const removeImage = formData.get("removeImage") === "true";
    const imageFile = formData.get("imageFile");

    if (!supabase) {
      const local = await readLocalCatalog();
      const existing = id ? local.products.find((p) => p.id === id) : undefined;
      let nextImageUrl: string | null = removeImage ? null : (existing?.imageUrl ?? null);
      if (imageFile instanceof File && imageFile.size > 0) {
        nextImageUrl = await uploadImageFile(null, imageFile, "products");
      }
      if (existing?.imageUrl && existing.imageUrl !== nextImageUrl) {
        await deleteStorageObjectIfOwned(null, existing.imageUrl);
      }

      const targetId = id ?? crypto.randomUUID();
      const nextProduct = {
        id: targetId,
        name,
        description,
        priceCents,
        categoryId,
        imageUrl: nextImageUrl,
        isAvailable,
        sortOrder,
      };
      const nextProducts = id
        ? local.products.map((p) => (p.id === id ? nextProduct : p))
        : [...local.products, nextProduct];

      await writeLocalCatalog({
        settings: local.settings,
        categories: local.categories,
        products: nextProducts,
      });
      refreshCatalogCaches(targetId);
      return { ok: true, message: id ? "Product updated." : "Product created." };
    }

    const priceDecimal = centsToDecimalString(priceCents);

    let existingImageUrl: string | null = null;
    if (id) {
      const { data: existing } = await supabase
        .from("products")
        .select("image_url")
        .eq("id", id)
        .maybeSingle<{ image_url: string | null }>();
      existingImageUrl = existing?.image_url ?? null;
    }

    let nextImageUrl: string | null = removeImage ? null : existingImageUrl;

    if (imageFile instanceof File && imageFile.size > 0) {
      nextImageUrl = await uploadImageFile(supabase, imageFile, "products");
    }

    if (id) {
      const { error } = await supabase
        .from("products")
        .update({
          name,
          description,
          price: priceDecimal,
          category_id: categoryId,
          image_url: nextImageUrl,
          is_available: isAvailable,
          sort_order: sortOrder,
        })
        .eq("id", id);

      if (error) {
        return { ok: false, error: "Could not update product." };
      }

      if (existingImageUrl && existingImageUrl !== nextImageUrl) {
        await deleteStorageObjectIfOwned(supabase, existingImageUrl);
      }

      refreshCatalogCaches(id);
      return { ok: true, message: "Product updated." };
    }

    const { data: created, error } = await supabase
      .from("products")
      .insert({
        name,
        description,
        price: priceDecimal,
        category_id: categoryId,
        image_url: nextImageUrl,
        is_available: isAvailable,
        sort_order: sortOrder,
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !created) {
      return { ok: false, error: "Could not create product." };
    }

    refreshCatalogCaches(created.id);
    return { ok: true, message: "Product created." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not save product.",
    };
  }
}

export async function toggleProductAvailabilityAction(
  productId: string,
  nextAvailable: boolean,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminMutation();
    if (!z.string().uuid().safeParse(productId).success) {
      return { ok: false, error: "Invalid product ID." };
    }

    if (!supabase) {
      const local = await readLocalCatalog();
      await writeLocalCatalog({
        settings: local.settings,
        categories: local.categories,
        products: local.products.map((p) =>
          p.id === productId ? { ...p, isAvailable: Boolean(nextAvailable) } : p,
        ),
      });
      refreshCatalogCaches(productId);
      return {
        ok: true,
        message: nextAvailable
          ? "Product published to storefront."
          : "Product hidden from storefront.",
      };
    }

    const { error } = await supabase
      .from("products")
      .update({ is_available: Boolean(nextAvailable) })
      .eq("id", productId);

    if (error) {
      return { ok: false, error: "Could not update product availability." };
    }

    refreshCatalogCaches(productId);
    return {
      ok: true,
      message: nextAvailable ? "Product published to storefront." : "Product hidden from storefront.",
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not update product.",
    };
  }
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminMutation();
    if (!z.string().uuid().safeParse(productId).success) {
      return { ok: false, error: "Invalid product ID." };
    }

    if (!supabase) {
      const local = await readLocalCatalog();
      const target = local.products.find((p) => p.id === productId);
      if (target?.imageUrl) {
        await deleteStorageObjectIfOwned(null, target.imageUrl);
      }
      await writeLocalCatalog({
        settings: local.settings,
        categories: local.categories,
        products: local.products.filter((p) => p.id !== productId),
      });
      refreshCatalogCaches(productId);
      return { ok: true, message: "Product deleted." };
    }

    const { data: existing } = await supabase
      .from("products")
      .select("image_url")
      .eq("id", productId)
      .maybeSingle<{ image_url: string | null }>();

    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) {
      return { ok: false, error: "Could not delete product." };
    }

    if (existing?.image_url) {
      await deleteStorageObjectIfOwned(supabase, existing.image_url);
    }

    refreshCatalogCaches(productId);
    return { ok: true, message: "Product deleted." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not delete product.",
    };
  }
}

// =============================================================================
// Shop Settings Actions
// =============================================================================

export async function saveShopSettingsAction(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminMutation();

    const shopName = cleanText(String(formData.get("shopName") ?? ""));
    if (!shopName || shopName.length > 120) {
      return { ok: false, error: "Shop name is required (up to 120 characters)." };
    }

    const description = cleanText(String(formData.get("description") ?? ""), { multiline: true });
    if (description.length > 600) {
      return { ok: false, error: "Description must be 600 characters or fewer." };
    }

    const rawWhatsapp = String(formData.get("whatsappNumber") ?? "").trim();
    const digitsOnly = rawWhatsapp ? normalizeWhatsAppNumber(rawWhatsapp) : "";
    if (digitsOnly && !isValidWhatsAppNumber(digitsOnly)) {
      return {
        ok: false,
        error:
          "WhatsApp number must be in international format using 8–15 digits only, without a leading 0 or + sign (example: 60123456789).",
      };
    }

    const currencyCode = String(formData.get("currencyCode") ?? "MYR")
      .trim()
      .toUpperCase();
    if (!SUPPORTED_CURRENCY_CODES.includes(currencyCode)) {
      return { ok: false, error: "Please choose a supported ISO currency code." };
    }

    const accentColor = String(formData.get("accentColor") ?? "#0f766e")
      .trim()
      .toLowerCase();
    if (!isHexColor(accentColor)) {
      return { ok: false, error: "Accent color must be a valid 6-digit hex color (e.g. #0f766e)." };
    }

    const removeLogo = formData.get("removeLogo") === "true";
    const logoFile = formData.get("logoFile");

    if (!supabase) {
      const local = await readLocalCatalog();
      let nextLogoUrl: string | null = removeLogo ? null : local.settings.logoUrl;
      if (logoFile instanceof File && logoFile.size > 0) {
        nextLogoUrl = await uploadImageFile(null, logoFile, "logos");
      }
      if (local.settings.logoUrl && local.settings.logoUrl !== nextLogoUrl) {
        await deleteStorageObjectIfOwned(null, local.settings.logoUrl);
      }

      await writeLocalCatalog({
        settings: {
          ...local.settings,
          shopName,
          description,
          logoUrl: nextLogoUrl,
          whatsappNumber: digitsOnly || null,
          currencyCode,
          accentColor,
          updatedAt: new Date().toISOString(),
        },
        categories: local.categories,
        products: local.products,
      });
      refreshCatalogCaches();
      return { ok: true, message: "Shop settings saved." };
    }

    const { data: currentRow } = await supabase
      .from("shop_settings")
      .select("id, logo_url")
      .limit(1)
      .maybeSingle<{ id: string; logo_url: string | null }>();

    let nextLogoUrl: string | null = removeLogo ? null : (currentRow?.logo_url ?? null);

    if (logoFile instanceof File && logoFile.size > 0) {
      nextLogoUrl = await uploadImageFile(supabase, logoFile, "logos");
    }

    const { error } = await supabase.from("shop_settings").upsert(
      {
        singleton_key: true,
        shop_name: shopName,
        description,
        logo_url: nextLogoUrl,
        whatsapp_number: digitsOnly || null,
        currency_code: currencyCode,
        accent_color: accentColor,
      },
      { onConflict: "singleton_key" },
    );

    if (error) {
      return { ok: false, error: "Could not save shop settings." };
    }

    if (currentRow?.logo_url && currentRow.logo_url !== nextLogoUrl) {
      await deleteStorageObjectIfOwned(supabase, currentRow.logo_url);
    }

    refreshCatalogCaches();
    return { ok: true, message: "Shop settings saved." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not save shop settings.",
    };
  }
}
