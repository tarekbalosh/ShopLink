# ShopLink — WhatsApp Product Catalog & Admin Dashboard

**ShopLink** is a mobile-first product catalog and admin dashboard built for small shops. Customers browse products, search and filter by category, add items to their cart, enter their name and optional order notes, and send a formatted order directly to the shop via WhatsApp (`wa.me`). No online payment gateway is used — WhatsApp is the ordering channel and the shop confirms availability directly with the customer.

---

## Features

### Public Storefront (`/`, `/products/[id]`)
- Shop header with logo, shop name, currency indicator, and live cart badge
- Hero banner with shop name and description
- Instant search and category filter chips
- Responsive product grid with consistent 1:1 product imagery and graceful fallback for missing/broken images
- Product detail page (`/products/[id]`)
- Slide-over shopping cart persisted in `localStorage` + sticky mobile bottom cart bar
- Quantity stepper, line totals, subtotal, and total calculated using integer minor units (cents) — never imprecise floating-point math
- Server-side price and availability re-verification right before generating the WhatsApp order
- Safe `https://wa.me/{number}?text={encodedMessage}` link generation, copyable message preview, and clear notice that orders are not confirmed or paid until sent on WhatsApp and confirmed by the shop
- Safe handling when the shop WhatsApp number is not yet configured

### Protected Admin Dashboard (`/admin`, `/admin/products`, `/admin/categories`, `/admin/settings`, `/admin/login`)
- Supabase Auth email/password sign-in + explicit `public.admin_users` allowlist check (being authenticated alone never grants admin access; no public admin registration)
- Overview cards for total/published/hidden products, category count, and WhatsApp channel status
- Product management: search, category filter, create, edit, publish/unpublish toggle, delete with confirmation, image preview before saving, and image replacement/removal in Supabase Storage
- Category management: create, edit, sort order, and delete with confirmation
- Shop settings: shop name, description, logo upload/replacement, international digits-only WhatsApp number with inline format guidance, ISO currency selector, and accent color picker with automatic contrast adjustment
- Instant cache invalidation (`updateTag` + `revalidatePath`) so storefront changes appear immediately

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Cache Components, TypeScript)
- **Styling:** Tailwind CSS v4
- **Database, Auth & Storage:** Supabase (PostgreSQL + RLS + Supabase Auth + Supabase Storage)
- **Validation & Icons:** Zod, `lucide-react`
- **Testing:** Vitest

---

## 1. Local Setup

### Prerequisites
- Node.js LTS (`>= 20`) and `npm`
- Git
- A [Supabase](https://supabase.com/) project

### Install dependencies

```bash
npm install
```

### Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Open `.env.local` and set your real Supabase project values (from **Supabase Dashboard → Project Settings → API / Connect**):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

> **Security note:** Never put a Supabase `service_role` or secret key in `.env.local` under a `NEXT_PUBLIC_` variable, in client code, or in Git. ShopLink is designed to work purely with the public anon/publishable key plus PostgreSQL Row Level Security (RLS).

---

## 2. Supabase Database, RLS & Storage Setup

1. Open your project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** → **New query**.
3. Copy the entire contents of [`supabase/migrations/20261109000000_init_shoplink.sql`](./supabase/migrations/20261109000000_init_shoplink.sql) and click **Run**.

This single idempotent migration creates and configures:
- **`public.admin_users`**: Admin allowlist table with RLS enabled & forced, write privileges revoked from `anon` and `authenticated`, and a `SECURITY DEFINER` helper function `public.is_admin()`.
- **`public.shop_settings`**: Singleton shop configuration row (`shop_name`, `description`, `logo_url`, `whatsapp_number`, `currency_code`, `accent_color`, `updated_at`) with public `SELECT` and admin-only `INSERT`/`UPDATE`/`DELETE`.
- **`public.categories`**: Product categories (`id`, `name`, `slug`, `sort_order`, `created_at`, `updated_at`) with public `SELECT` and admin-only `INSERT`/`UPDATE`/`DELETE`.
- **`public.products`**: Catalog products (`id`, `category_id`, `name`, `description`, `price numeric(12,2)`, `image_url`, `is_available`, `sort_order`, `created_at`, `updated_at`). Public visitors can only `SELECT` rows where `is_available = true`; authorized admins can read and mutate all rows.
- **Storage bucket `shop-images`**: Public read bucket (5 MB limit; JPEG, PNG, WebP, GIF) with `storage.objects` policies allowing anyone to view images and only authorized admins (`public.is_admin()`) to upload, update, or delete images.

### Verify RLS Policies (Optional)
Run [`supabase/verify_rls.sql`](./supabase/verify_rls.sql) in the Supabase SQL Editor to inspect the active RLS flags and policies across all tables and `storage.objects`.

---

## 3. Creating the First Admin User (Safe Procedure)

ShopLink does **not** allow public admin sign-up, and it does **not** assume every authenticated user is an admin. To create and authorize the first shop admin:

1. In the Supabase Dashboard, go to **Authentication → Users** and click **Add user → Create new user**.
2. Enter the admin's **Email** and a strong **Password**, check **Auto Confirm User**, and click **Create user**.
3. Open **SQL Editor → New query** and run the following SQL (replace `owner@example.com` with the email you just created):

```sql
insert into public.admin_users (user_id, email)
select id, email
from auth.users
where email = 'owner@example.com'
on conflict (user_id) do update
set email = excluded.email;
```

4. Start the local dev server and sign in at `http://localhost:3000/admin/login`:

```bash
npm run dev
```

---

## 4. Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local Next.js development server on `http://localhost:3000` |
| `npm run build` | Build the production application |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Generate Next.js route types and run `tsc --noEmit` |
| `npm test` | Run Vitest unit & integration tests (money math, cart, WhatsApp builder, checkout verification) |
| `npm run verify:security` | Verify RLS policies, Storage policies, server action guards, and absence of service-role keys |

---

## 5. Deploying to GitHub & Vercel

### Push to GitHub

1. Create a new repository on [GitHub](https://github.com/new) (e.g. `shoplink`).
2. Verify `git status` to ensure `.env.local` is **not** staged:

```bash
git status
git add .
git commit -m "Initial ShopLink WhatsApp catalog"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/shoplink.git
git push -u origin main
```

### Deploy on Vercel

1. Open [Vercel](https://vercel.com/new) and import your `shoplink` GitHub repository.
2. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://YOUR_PROJECT_ID.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY`
   *(Never add `service_role` or secret keys to `NEXT_PUBLIC_` variables.)*
3. Click **Deploy**.

---

## 6. Manual Testing & Delivery Checklist

- [ ] **Public Storefront:** Available products, categories, search, and product detail pages render on mobile and desktop.
- [ ] **Unavailable Products:** Hidden/unavailable products do not appear in the public catalog and cannot be ordered even if previously in a customer's cart.
- [ ] **Shopping Cart:** Adding items, incrementing/decrementing quantities, removing items, local persistence across page reloads, and exact currency totals work properly.
- [ ] **WhatsApp Checkout:** Entering customer name, optional phone, and optional order note generates a properly URL-encoded `https://wa.me/{number}?text=...` link with shop name, items, quantities, unit prices, line totals, subtotal, total, and confirmation notice.
- [ ] **Missing/Invalid WhatsApp Number:** When no valid WhatsApp number is configured, a clear warning is shown instead of a broken link.
- [ ] **Unauthenticated Access:** Visiting `/admin`, `/admin/products`, `/admin/categories`, or `/admin/settings` while logged out redirects to `/admin/login`.
- [ ] **Non-Admin User Protection:** A user registered in `auth.users` who is **not** in `public.admin_users` is rejected at `/admin/login`, cannot access admin pages, and is blocked by both server action checks and PostgreSQL RLS from mutating `shop_settings`, `categories`, `products`, or `storage.objects`.
- [ ] **Authorized Admin Actions:** An allowlisted admin can create/edit/publish/unpublish/delete products, upload/replace product images, create/edit/delete categories, and update shop settings (name, description, logo, WhatsApp number, currency, accent color), with changes immediately reflected on the public storefront.
