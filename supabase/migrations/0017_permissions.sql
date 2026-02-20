-- Helper functions for RLS
create or replace function public.is_brand_member(_brand_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.brand_members
    where brand_id = _brand_id
    and user_id = auth.uid()
  ) or exists (
    select 1 from public.brands
    where id = _brand_id
    and owner_user_id = auth.uid()
  );
$$;

create or replace function public.has_brand_write_access(_brand_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.brand_members
    where brand_id = _brand_id
    and user_id = auth.uid()
    and role in ('owner', 'admin', 'editor')
  ) or exists (
    select 1 from public.brands
    where id = _brand_id
    and owner_user_id = auth.uid()
  );
$$;

-- Drop existing restrictive policies
drop policy if exists "brands_select_own" on public.brands;
drop policy if exists "brands_insert_own" on public.brands;
drop policy if exists "brands_update_own" on public.brands;
drop policy if exists "brands_delete_own" on public.brands;

drop policy if exists "costs_all_brand_owner" on public.costs;

drop policy if exists "shopify_connections_all_brand_owner" on public.shopify_connections;
drop policy if exists "shopify_orders_all_brand_owner" on public.shopify_orders;

drop policy if exists "meta_connections_all_brand_owner" on public.meta_connections;
drop policy if exists "meta_daily_spend_all_brand_owner" on public.meta_daily_spend;

drop policy if exists "wallets_all_brand_owner" on public.wallets;
drop policy if exists "wallet_transactions_all_brand_owner" on public.wallet_transactions;
drop policy if exists "manual_revenues_all_brand_owner" on public.manual_revenues;

drop policy if exists "revenue_line_items_brand_owner" on public.revenue_line_items;
drop policy if exists "cost_line_items_brand_owner" on public.cost_line_items;
drop policy if exists "ocr_logs_brand_owner" on public.ocr_processing_logs;


-- Create new improved policies

-- BRANDS
create policy "brands_view_custom" on public.brands for select
using ( is_brand_member(id) );

create policy "brands_manage_own" on public.brands for all
using ( owner_user_id = auth.uid() );


-- COSTS
create policy "costs_view_members" on public.costs for select
using ( is_brand_member(brand_id) );

create policy "costs_manage_privileged" on public.costs for all
using ( has_brand_write_access(brand_id) );


-- SHOPIFY
create policy "shopify_conn_view" on public.shopify_connections for select
using ( is_brand_member(brand_id) );
create policy "shopify_conn_manage" on public.shopify_connections for all
using ( has_brand_write_access(brand_id) );

create policy "shopify_orders_view" on public.shopify_orders for select
using ( is_brand_member(brand_id) );
create policy "shopify_orders_manage" on public.shopify_orders for all
using ( has_brand_write_access(brand_id) );


-- META
create policy "meta_conn_view" on public.meta_connections for select
using ( is_brand_member(brand_id) );
create policy "meta_conn_manage" on public.meta_connections for all
using ( has_brand_write_access(brand_id) );

create policy "meta_spend_view" on public.meta_daily_spend for select
using ( is_brand_member(brand_id) );
create policy "meta_spend_manage" on public.meta_daily_spend for all
using ( has_brand_write_access(brand_id) );


-- WALLETS & REVENUE
create policy "wallets_view" on public.wallets for select
using ( is_brand_member(brand_id) );
create policy "wallets_manage" on public.wallets for all
using ( has_brand_write_access(brand_id) );

create policy "wallet_tx_view" on public.wallet_transactions for select
using ( is_brand_member(brand_id) );
create policy "wallet_tx_manage" on public.wallet_transactions for all
using ( has_brand_write_access(brand_id) );

create policy "manual_rev_view" on public.manual_revenues for select
using ( is_brand_member(brand_id) );
create policy "manual_rev_manage" on public.manual_revenues for all
using ( has_brand_write_access(brand_id) );


-- LINE ITEMS & LOGS
create policy "rev_items_view" on public.revenue_line_items for select
using ( is_brand_member(brand_id) );
create policy "rev_items_manage" on public.revenue_line_items for all
using ( has_brand_write_access(brand_id) );

create policy "cost_items_view" on public.cost_line_items for select
using ( is_brand_member(brand_id) );
create policy "cost_items_manage" on public.cost_line_items for all
using ( has_brand_write_access(brand_id) );

create policy "ocr_logs_view" on public.ocr_processing_logs for select
using ( is_brand_member(brand_id) );
create policy "ocr_logs_manage" on public.ocr_processing_logs for all
using ( has_brand_write_access(brand_id) );
