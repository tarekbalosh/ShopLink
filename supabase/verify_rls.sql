-- =============================================================================
-- ShopLink — RLS & Authorization Verification Queries
-- Run this in the Supabase SQL Editor after applying the migration to verify
-- that Row Level Security is enabled and policies behave as expected.
-- =============================================================================

-- 1. Confirm RLS is enabled and forced on all 4 public tables:
select
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  forcerowsecurity as rls_forced
from pg_tables
where schemaname = 'public'
  and tablename in ('admin_users', 'shop_settings', 'categories', 'products')
order by tablename;

-- 2. List all active policies on public tables and storage.objects:
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where (schemaname = 'public' and tablename in ('admin_users', 'shop_settings', 'categories', 'products'))
   or (schemaname = 'storage' and tablename = 'objects' and policyname like 'shop_images_%')
order by schemaname, tablename, policyname;

