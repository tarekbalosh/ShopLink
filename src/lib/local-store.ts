import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { demoCatalog } from "./demo-data";
import type { Catalog, Category, Product, ShopSettings } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "catalog.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

type StoredCatalog = {
  settings: ShopSettings;
  categories: Category[];
  products: Product[];
};

function initialStore(): StoredCatalog {
  return {
    settings: {
      ...demoCatalog.settings,
      shopName: "ShopLink Bakery",
    },
    categories: demoCatalog.categories.map((c) => ({ ...c })),
    products: demoCatalog.products.map((p) => ({ ...p })),
  };
}

export async function readLocalCatalog(): Promise<Catalog> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoredCatalog;
    return {
      settings: parsed.settings,
      categories: parsed.categories,
      products: parsed.products,
      source: "demo",
    };
  } catch {
    const seed = initialStore();
    return {
      ...seed,
      source: "demo",
    };
  }
}

export async function writeLocalCatalog(next: StoredCatalog): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(next, null, 2), "utf8");
}

export async function saveLocalUploadedImage(
  file: File,
  folder: "products" | "logos",
  ext: string,
): Promise<string> {
  const targetDir = path.join(UPLOADS_DIR, folder);
  await fs.mkdir(targetDir, { recursive: true });
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const fullPath = path.join(targetDir, fileName);
  const bytes = new Uint8Array(await file.arrayBuffer());
  await fs.writeFile(fullPath, bytes);
  return `/uploads/${folder}/${fileName}`;
}

export async function deleteLocalUploadedImage(publicUrl: string | null | undefined): Promise<void> {
  if (!publicUrl || !publicUrl.startsWith("/uploads/")) return;
  const relPath = publicUrl.replace(/^\/+/, "");
  const fullPath = path.join(process.cwd(), "public", relPath.replace(/^uploads\//, "uploads/"));
  try {
    await fs.unlink(fullPath);
  } catch {
    // Ignore if already removed.
  }
}
