-- Comprehensive features migration
-- Adds: wallet system, budget limits, active/inactive status, transfers

-- Add is_basic flag to wallets (one basic wallet per brand)
alter table public.wallets add column if not exists is_basic boolean not null default false;
alter table public.wallets add column if not exists is_active boolean not null default true;

-- Add unique constraint for basic wallet
create unique index if not exists wallets_one_basic_per_brand 
  on public.wallets(brand_id) where is_basic = true;

-- Drop existing tables if they exist to avoid conflicts
drop table if exists public.wallet_transfers cascade;
drop table if exists public.wallet_transactions cascade;

-- Wallet transfers table
create table public.wallet_transfers (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  from_wallet_id uuid references public.wallets(id) on delete cascade,
  to_wallet_id uuid references public.wallets(id) on delete cascade,
  amount numeric(12,2) not null,
  description text,
  transfer_date date not null,
  created_at timestamptz not null default now(),
  constraint positive_amount check (amount > 0)
);

-- Wallet transactions table (for add/deduct operations)
create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  amount numeric(12,2) not null,
  transaction_type text not null check (transaction_type in ('add', 'deduct', 'cost_deduction')),
  description text,
  transaction_date date not null,
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default now()
);

-- Monthly budget limits table
create table if not exists public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  month text not null, -- Format: YYYY-MM
  budget_limit numeric(12,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_brand_month unique (brand_id, month)
);

-- Predictive insights table
create table if not exists public.predictive_insights (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  insight_type text not null check (insight_type in ('revenue_forecast', 'cost_forecast', 'cash_flow_alert', 'trend_analysis')),
  title text not null,
  description text not null,
  prediction_value numeric(12,2),
  confidence_score numeric(3,2), -- 0.00 to 1.00
  period_start date,
  period_end date,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.wallet_transfers enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.predictive_insights enable row level security;

-- RLS policies for wallet_transfers
create policy wallet_transfers_brand_owner on public.wallet_transfers for all to authenticated
using (exists (select 1 from public.brands b where b.id = wallet_transfers.brand_id and b.owner_user_id = auth.uid()))
with check (exists (select 1 from public.brands b where b.id = wallet_transfers.brand_id and b.owner_user_id = auth.uid()));

-- RLS policies for wallet_transactions
create policy wallet_transactions_brand_owner on public.wallet_transactions for all to authenticated
using (exists (select 1 from public.brands b where b.id = wallet_transactions.brand_id and b.owner_user_id = auth.uid()))
with check (exists (select 1 from public.brands b where b.id = wallet_transactions.brand_id and b.owner_user_id = auth.uid()));

-- RLS policies for monthly_budgets
create policy monthly_budgets_brand_owner on public.monthly_budgets for all to authenticated
using (exists (select 1 from public.brands b where b.id = monthly_budgets.brand_id and b.owner_user_id = auth.uid()))
with check (exists (select 1 from public.brands b where b.id = monthly_budgets.brand_id and b.owner_user_id = auth.uid()));

-- RLS policies for predictive_insights
create policy predictive_insights_brand_owner on public.predictive_insights for all to authenticated
using (exists (select 1 from public.brands b where b.id = predictive_insights.brand_id and b.owner_user_id = auth.uid()))
with check (exists (select 1 from public.brands b where b.id = predictive_insights.brand_id and b.owner_user_id = auth.uid()));

-- Create indexes
create index if not exists wallet_transfers_brand_idx on public.wallet_transfers(brand_id, transfer_date);
create index if not exists wallet_transactions_wallet_idx on public.wallet_transactions(wallet_id, transaction_date);
create index if not exists monthly_budgets_brand_month_idx on public.monthly_budgets(brand_id, month);
create index if not exists predictive_insights_brand_idx on public.predictive_insights(brand_id, created_at desc);

-- Trigger for monthly_budgets updated_at
create trigger monthly_budgets_set_updated_at
before update on public.monthly_budgets
for each row execute function public.set_updated_at();
