-- Combined Finance System Migrations
-- Run this in Supabase SQL Editor after running migrations 0001 and 0002

-- Migration 0003: Finance system enums and tables
create extension if not exists "pgcrypto";

-- Cash flow sections
do $$ begin
  if not exists (select 1 from pg_type where typname = 'cash_flow_section') then
    create type public.cash_flow_section as enum ('operating', 'investing', 'financing');
  end if;
end $$;

-- Cash transaction categories
do $$ begin
  if not exists (select 1 from pg_type where typname = 'transaction_category') then
    create type public.transaction_category as enum (
      'orders', 'subscriptions', 'other_income',
      'meta_ads', 'salaries', 'tools', 'operating_costs', 'shipping_fulfillment', 'packaging', 'inventory_purchase', 'taxes', 'other_expense',
      'asset_purchase', 'asset_sale', 'website_development',
      'investment_in', 'loan_in', 'loan_out', 'profit_share'
    );
  end if;
end $$;

-- Cash transactions table
create table if not exists public.cash_transactions (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  date date not null,
  section public.cash_flow_section not null,
  category public.transaction_category not null,
  amount numeric(12,2) not null,
  description text,
  reference_type text,
  reference_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cash_transactions_section_category_check check (
    (section = 'operating' and category in ('orders', 'subscriptions', 'other_income', 'meta_ads', 'salaries', 'tools', 'operating_costs', 'shipping_fulfillment', 'packaging', 'inventory_purchase', 'taxes', 'other_expense')) or
    (section = 'investing' and category in ('asset_purchase', 'asset_sale', 'website_development')) or
    (section = 'financing' and category in ('investment_in', 'loan_in', 'loan_out', 'profit_share'))
  )
);

create trigger cash_transactions_set_updated_at
before update on public.cash_transactions
for each row execute function public.set_updated_at();

create index if not exists cash_transactions_brand_date_idx on public.cash_transactions (brand_id, date);
create index if not exists cash_transactions_section_idx on public.cash_transactions (brand_id, section, date);

-- Employees table
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  position text,
  monthly_salary numeric(12,2) not null,
  start_date date not null,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger employees_set_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

create index if not exists employees_brand_active_idx on public.employees (brand_id, active);

-- Salary payments table
create table if not exists public.salary_payments (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  payment_date date not null,
  amount numeric(12,2) not null,
  period_month text not null,
  note text,
  cash_transaction_id uuid references public.cash_transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint salary_payments_unique unique (brand_id, employee_id, period_month)
);

create trigger salary_payments_set_updated_at
before update on public.salary_payments
for each row execute function public.set_updated_at();

create index if not exists salary_payments_brand_date_idx on public.salary_payments (brand_id, payment_date);

-- Assets table
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  category text not null,
  purchase_date date not null,
  purchase_amount numeric(12,2) not null,
  current_value numeric(12,2) not null,
  depreciation_rate numeric(5,2),
  sale_date date,
  sale_amount numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger assets_set_updated_at
before update on public.assets
for each row execute function public.set_updated_at();

create index if not exists assets_brand_idx on public.assets (brand_id);

-- Equity snapshots table
create table if not exists public.equity_snapshots (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  snapshot_date date not null,
  total_equity numeric(12,2) not null,
  retained_earnings numeric(12,2) not null default 0,
  owner_capital numeric(12,2) not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint equity_snapshots_unique unique (brand_id, snapshot_date)
);

create trigger equity_snapshots_set_updated_at
before update on public.equity_snapshots
for each row execute function public.set_updated_at();

create index if not exists equity_snapshots_brand_date_idx on public.equity_snapshots (brand_id, snapshot_date);

-- Working capital snapshots table
create table if not exists public.working_capital_snapshots (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  snapshot_date date not null,
  inventory numeric(12,2) not null default 0,
  accounts_receivable numeric(12,2) not null default 0,
  accounts_payable numeric(12,2) not null default 0,
  cash numeric(12,2) not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint working_capital_snapshots_unique unique (brand_id, snapshot_date)
);

create trigger working_capital_snapshots_set_updated_at
before update on public.working_capital_snapshots
for each row execute function public.set_updated_at();

create index if not exists working_capital_snapshots_brand_date_idx on public.working_capital_snapshots (brand_id, snapshot_date);

-- Migration 0004: RLS policies for finance tables
alter table public.cash_transactions enable row level security;
alter table public.employees enable row level security;
alter table public.salary_payments enable row level security;
alter table public.assets enable row level security;
alter table public.equity_snapshots enable row level security;
alter table public.working_capital_snapshots enable row level security;

create policy cash_transactions_all_brand_owner on public.cash_transactions for all to authenticated
using (exists (select 1 from public.brands b where b.id = cash_transactions.brand_id and b.owner_user_id = auth.uid()))
with check (exists (select 1 from public.brands b where b.id = cash_transactions.brand_id and b.owner_user_id = auth.uid()));

create policy employees_all_brand_owner on public.employees for all to authenticated
using (exists (select 1 from public.brands b where b.id = employees.brand_id and b.owner_user_id = auth.uid()))
with check (exists (select 1 from public.brands b where b.id = employees.brand_id and b.owner_user_id = auth.uid()));

create policy salary_payments_all_brand_owner on public.salary_payments for all to authenticated
using (exists (select 1 from public.brands b where b.id = salary_payments.brand_id and b.owner_user_id = auth.uid()))
with check (exists (select 1 from public.brands b where b.id = salary_payments.brand_id and b.owner_user_id = auth.uid()));

create policy assets_all_brand_owner on public.assets for all to authenticated
using (exists (select 1 from public.brands b where b.id = assets.brand_id and b.owner_user_id = auth.uid()))
with check (exists (select 1 from public.brands b where b.id = assets.brand_id and b.owner_user_id = auth.uid()));

create policy equity_snapshots_all_brand_owner on public.equity_snapshots for all to authenticated
using (exists (select 1 from public.brands b where b.id = equity_snapshots.brand_id and b.owner_user_id = auth.uid()))
with check (exists (select 1 from public.brands b where b.id = equity_snapshots.brand_id and b.owner_user_id = auth.uid()));

create policy working_capital_snapshots_all_brand_owner on public.working_capital_snapshots for all to authenticated
using (exists (select 1 from public.brands b where b.id = working_capital_snapshots.brand_id and b.owner_user_id = auth.uid()))
with check (exists (select 1 from public.brands b where b.id = working_capital_snapshots.brand_id and b.owner_user_id = auth.uid()));
