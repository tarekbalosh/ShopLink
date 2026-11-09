-- =============================================================================
-- ShopLink — Supabase PostgreSQL Schema, Row Level Security & Storage Policies
-- =============================================================================
-- Run this entire script in the Supabase SQL Editor (or via `supabase db push`).
-- It is idempotent and safe to re-run.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Extensions & helper trigger function for `updated_at`
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Admin allowlist table (`admin_users`)
--    Do NOT assume every authenticated user is an admin.
--    Only rows in `public.admin_users` grant admin privileges.
--    Regular users cannot insert, update, or delete rows in this table.
-- -----------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.admin_users enable row level security;
alter table public.admin_users force row level security;

-- Helper function used by RLS policies and server authorization checks.
-- Marked SECURITY DEFINER with fixed search_path so RLS policies on other tables
-- can check admin membership without recursive policy evaluation.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Admin users can only read their own allowlist row. Nobody can mutate this
-- table through the client API (mutations happen only via the Supabase SQL Editor
-- using the postgres role).
drop policy if exists "admin_users_select_self" on public.admin_users;
create policy "admin_users_select_self"
  on public.admin_users
  for select
  to authenticated
  using (user_id = auth.uid());

-- Explicitly revoke write privileges from client API roles on admin_users.
revoke insert, update, delete, truncate on public.admin_users from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. `shop_settings` (singleton row enforced by `singleton_key`)
-- -----------------------------------------------------------------------------
create table if not exists public.shop_settings (
  id uuid primary key default gen_random_uuid(),
  singleton_key boolean not null default true unique check (singleton_key = true),
  shop_name text not null default 'ShopLink' check (char_length(btrim(shop_name)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 600),
  logo_url text,
  whatsapp_number text check (
    whatsapp_number is null
    or whatsapp_number ~ '^[1-9][0-9]{7,14}$'
  ),
  currency_code text not null default 'MYR' check (currency_code ~ '^[A-Z]{3}$'),
  accent_color text not null default '#0f766e' check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_shop_settings_updated_at on public.shop_settings;
create trigger trg_shop_settings_updated_at
  before update on public.shop_settings
  for each row
  execute function public.set_updated_at();

alter table public.shop_settings enable row level security;
alter table public.shop_settings force row level security;

drop policy if exists "shop_settings_public_read" on public.shop_settings;
create policy "shop_settings_public_read"
  on public.shop_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "shop_settings_admin_insert" on public.shop_settings;
create policy "shop_settings_admin_insert"
  on public.shop_settings
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "shop_settings_admin_update" on public.shop_settings;
create policy "shop_settings_admin_update"
  on public.shop_settings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "shop_settings_admin_delete" on public.shop_settings;
create policy "shop_settings_admin_delete"
  on public.shop_settings
  for delete
  to authenticated
  using (public.is_admin());

-- Ensure the default singleton settings row exists.
insert into public.shop_settings (singleton_key, shop_name, description, currency_code, accent_color)
values (
  true,
  'ShopLink',
  'Browse our catalog, add items to your cart, and send your order on WhatsApp.',
  'MYR',
  '#0f766e'
)
on conflict (singleton_key) do nothing;

-- -----------------------------------------------------------------------------
-- 4. `categories`
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) <= 90),
  sort_order integer not null default 0 check (sort_order between -9999 and 99999),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_categories_sort_order
  on public.categories (sort_order asc, name asc);

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
  before update on public.categories
  for each row
  execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.categories force row level security;

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
  on public.categories
  for select
  to anon, authenticated
  using (true);

drop policy if exists "categories_admin_insert" on public.categories;
create policy "categories_admin_insert"
  on public.categories
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "categories_admin_update" on public.categories;
create policy "categories_admin_update"
  on public.categories
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "categories_admin_delete" on public.categories;
create policy "categories_admin_delete"
  on public.categories
  for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5. `products`
--    Money is stored as `numeric(12,2)` (never floating point).
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null check (char_length(btrim(name)) between 1 and 140),
  description text not null default '' check (char_length(description) <= 2000),
  price numeric(12, 2) not null check (price >= 0 and price <= 99999999.99),
  image_url text,
  is_available boolean not null default true,
  sort_order integer not null default 0 check (sort_order between -9999 and 99999),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_products_public_catalog
  on public.products (is_available, sort_order asc, created_at desc);

create index if not exists idx_products_category_id
  on public.products (category_id);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row
  execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.products force row level security;

-- Public visitors can only read available products; authorized admins can read all products.
drop policy if exists "products_public_read_available" on public.products;
create policy "products_public_read_available"
  on public.products
  for select
  to anon, authenticated
  using (is_available = true or public.is_admin());

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert"
  on public.products
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update"
  on public.products
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete"
  on public.products
  for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. Supabase Storage bucket (`shop-images`) and RLS policies
--    Public visitors can view images; only authorized admins can upload,
--    replace, or delete images.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-images',
  'shop-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "shop_images_public_read" on storage.objects;
create policy "shop_images_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'shop-images');

drop policy if exists "shop_images_admin_insert" on storage.objects;
create policy "shop_images_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'shop-images'
    and public.is_admin()
  );

drop policy if exists "shop_images_admin_update" on storage.objects;
create policy "shop_images_admin_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'shop-images'
    and public.is_admin()
  )
  with check (
    bucket_id = 'shop-images'
    and public.is_admin()
  );

drop policy if exists "shop_images_admin_delete" on storage.objects;
create policy "shop_images_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'shop-images'
    and public.is_admin()
  );

commit;

