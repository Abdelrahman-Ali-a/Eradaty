-- Migration 0001: Create tables, enums, and triggers
create extension if not exists "pgcrypto";

do $$ begin
  if not exists (select 1 from pg_type where typname = 'cost_category') then
    create type public.cost_category as enum (
      'inventory_purchase',
      'operational',
      'shipping_fulfillment',
      'packaging',
      'marketing_other',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'recurring_period') then
    create type public.recurring_period as enum ('weekly', 'monthly');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  currency text not null default 'EGP',
  timezone text not null default 'Africa/Cairo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brands_one_per_user unique (owner_user_id)
);

create trigger brands_set_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

create table if not exists public.costs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  date date not null,
  amount numeric(12,2) not null,
  category public.cost_category not null,
  vendor text,
  note text,
  recurring public.recurring_period,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint costs_source_manual_check check (source = 'manual')
);

create trigger costs_set_updated_at
before update on public.costs
for each row execute function public.set_updated_at();

create table if not exists public.shopify_connections (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  shop_domain text not null,
  access_token text not null,
  scopes text,
  connected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shopify_connections_one_per_brand unique (brand_id)
);

create trigger shopify_connections_set_updated_at
before update on public.shopify_connections
for each row execute function public.set_updated_at();

create table if not exists public.shopify_orders (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  shop_domain text not null,
  order_id text not null,
  created_at timestamptz not null,
  currency text not null,
  gross numeric(12,2) not null default 0,
  discounts numeric(12,2) not null default 0,
  refunds numeric(12,2) not null default 0,
  net numeric(12,2) not null default 0,
  raw_json jsonb not null default '{}'::jsonb,
  constraint shopify_orders_unique unique (brand_id, shop_domain, order_id)
);

create table if not exists public.meta_connections (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  ad_account_id text not null,
  access_token text not null,
  connected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meta_connections_one_per_brand unique (brand_id)
);

create trigger meta_connections_set_updated_at
before update on public.meta_connections
for each row execute function public.set_updated_at();

create table if not exists public.meta_daily_spend (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  ad_account_id text not null,
  date date not null,
  currency text not null,
  spend numeric(12,2) not null default 0,
  campaign_id text not null,
  campaign_name text,
  adset_id text not null,
  adset_name text,
  constraint meta_daily_spend_unique unique (brand_id, ad_account_id, date, campaign_id, adset_id)
);

create index if not exists costs_brand_date_idx on public.costs (brand_id, date);
create index if not exists shopify_orders_brand_created_at_idx on public.shopify_orders (brand_id, created_at);
create index if not exists meta_daily_spend_brand_date_idx on public.meta_daily_spend (brand_id, date);


-- Migration 0002: Enable Row Level Security (RLS)
alter table public.brands enable row level security;
alter table public.costs enable row level security;
alter table public.shopify_connections enable row level security;
alter table public.shopify_orders enable row level security;
alter table public.meta_connections enable row level security;
alter table public.meta_daily_spend enable row level security;

create policy brands_select_own
on public.brands
for select
to authenticated
using (owner_user_id = auth.uid());

create policy brands_insert_own
on public.brands
for insert
to authenticated
with check (owner_user_id = auth.uid());

create policy brands_update_own
on public.brands
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy brands_delete_own
on public.brands
for delete
to authenticated
using (owner_user_id = auth.uid());

create policy costs_all_brand_owner
on public.costs
for all
to authenticated
using (
  exists (
    select 1 from public.brands b
    where b.id = costs.brand_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.brands b
    where b.id = costs.brand_id
      and b.owner_user_id = auth.uid()
  )
);

create policy shopify_connections_all_brand_owner
on public.shopify_connections
for all
to authenticated
using (
  exists (
    select 1 from public.brands b
    where b.id = shopify_connections.brand_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.brands b
    where b.id = shopify_connections.brand_id
      and b.owner_user_id = auth.uid()
  )
);

create policy shopify_orders_all_brand_owner
on public.shopify_orders
for all
to authenticated
using (
  exists (
    select 1 from public.brands b
    where b.id = shopify_orders.brand_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.brands b
    where b.id = shopify_orders.brand_id
      and b.owner_user_id = auth.uid()
  )
);

create policy meta_connections_all_brand_owner
on public.meta_connections
for all
to authenticated
using (
  exists (
    select 1 from public.brands b
    where b.id = meta_connections.brand_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.brands b
    where b.id = meta_connections.brand_id
      and b.owner_user_id = auth.uid()
  )
);

create policy meta_daily_spend_all_brand_owner
on public.meta_daily_spend
for all
to authenticated
using (
  exists (
    select 1 from public.brands b
    where b.id = meta_daily_spend.brand_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.brands b
    where b.id = meta_daily_spend.brand_id
      and b.owner_user_id = auth.uid()
  )
);
