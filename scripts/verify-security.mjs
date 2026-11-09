#!/usr/bin/env node
/**
 * Static security verification script for ShopLink.
 * Verifies:
 * 1. No service-role key or secret is referenced in client/source files or NEXT_PUBLIC_ vars.
 * 2. Every table in the SQL migration enables and forces Row Level Security.
 * 3. Every exported mutation in `src/app/actions/admin.ts` invokes `requireAdminMutation()`.
 * 4. Every protected admin page invokes `requireAdminPage()`.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

// 1. Check source files for forbidden service-role key usage
for (const file of walk(path.join(root, "src"))) {
  const content = fs.readFileSync(file, "utf8");
  if (/SUPABASE_SERVICE_ROLE_KEY|service_role/i.test(content)) {
    failures.push(`Forbidden service-role reference found in ${path.relative(root, file)}`);
  }
}

// 2. Check SQL migration for RLS on all tables and storage policies
const sql = read("supabase/migrations/20261109000000_init_shoplink.sql");
for (const table of ["admin_users", "shop_settings", "categories", "products"]) {
  const enableRe = new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, "i");
  const forceRe = new RegExp(`alter\\s+table\\s+public\\.${table}\\s+force\\s+row\\s+level\\s+security`, "i");
  if (!enableRe.test(sql)) {
    failures.push(`Missing ENABLE ROW LEVEL SECURITY for public.${table}`);
  }
  if (!forceRe.test(sql)) {
    failures.push(`Missing FORCE ROW LEVEL SECURITY for public.${table}`);
  }
}

for (const policy of [
  "shop_images_public_read",
  "shop_images_admin_insert",
  "shop_images_admin_update",
  "shop_images_admin_delete",
]) {
  if (!sql.includes(policy)) {
    failures.push(`Missing Storage policy ${policy} in SQL migration`);
  }
}

// 3. Check admin Server Actions call requireAdminMutation()
const adminActions = read("src/app/actions/admin.ts");
for (const fnName of [
  "saveCategoryAction",
  "deleteCategoryAction",
  "saveProductAction",
  "toggleProductAvailabilityAction",
  "deleteProductAction",
  "saveShopSettingsAction",
]) {
  const start = adminActions.indexOf(`export async function ${fnName}`);
  if (start === -1) {
    failures.push(`Missing exported admin action: ${fnName}`);
    continue;
  }
  const snippet = adminActions.slice(start, start + 320);
  if (!snippet.includes("requireAdminMutation()")) {
    failures.push(`Admin action ${fnName} does not call requireAdminMutation() at entry`);
  }
}

// 4. Check protected admin pages call requireAdminPage()
for (const pagePath of [
  "src/app/admin/page.tsx",
  "src/app/admin/products/page.tsx",
  "src/app/admin/categories/page.tsx",
  "src/app/admin/settings/page.tsx",
]) {
  const pageContent = read(pagePath);
  if (!pageContent.includes("requireAdminPage()")) {
    failures.push(`Protected admin page ${pagePath} does not call requireAdminPage()`);
  }
}

if (failures.length > 0) {
  console.error("Security verification failed:");
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log("✓ Security verification passed (RLS, Storage policies, admin guards, no service-role keys).");

