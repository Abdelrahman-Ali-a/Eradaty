-- Wallets and Revenue System Migration
-- Run this in Supabase SQL Editor after running the finance migrations

-- Wallets table for payment tracking and budgets
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  type text not null check (type in ('bank', 'cash', 'digital', 'other')),
  currency text not null default 'EGP',
  current_balance numeric(12,2) not null default 0,
  monthly_budget numeric(12,2),
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger wallets_set_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();

create index if not exists wallets_brand_active_idx on public.wallets (brand_id, active);

-- Wallet transactions table
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  date date not null,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric(12,2) not null,
  category text,
  description text,
  reference_type text,
  reference_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger wallet_transactions_set_updated_at
before update on public.wallet_transactions
for each row execute function public.set_updated_at();

create index if not exists wallet_transactions_wallet_date_idx on public.wallet_transactions (wallet_id, date);

-- Manual revenue entries table
create table if not exists public.manual_revenues (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  date date not null,
  amount numeric(12,2) not null,
  source text not null check (source in ('subscription', 'service', 'product', 'other')),
  customer_name text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger manual_revenues_set_updated_at
before update on public.manual_revenues
for each row execute function public.set_updated_at();

create index if not exists manual_revenues_brand_date_idx on public.manual_revenues (brand_id, date);

-- RLS policies
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.manual_revenues enable row level security;

create policy wallets_all_brand_owner on public.wallets for all to authenticated
using (exists (select 1 from public.brands b where b.id = wallets.brand_id and b.owner_user_id = auth.uid()))
with check (exists (select 1 from public.brands b where b.id = wallets.brand_id and b.owner_user_id = auth.uid()));

create policy wallet_transactions_all_brand_owner on public.wallet_transactions for all to authenticated
using (exists (select 1 from public.brands b where b.id = wallet_transactions.brand_id and b.owner_user_id = auth.uid()))
with check (exists (select 1 from public.brands b where b.id = wallet_transactions.brand_id and b.owner_user_id = auth.uid()));

create policy manual_revenues_all_brand_owner on public.manual_revenues for all to authenticated
using (exists (select 1 from public.brands b where b.id = manual_revenues.brand_id and b.owner_user_id = auth.uid()))
with check (exists (select 1 from public.brands b where b.id = manual_revenues.brand_id and b.owner_user_id = auth.uid()));
