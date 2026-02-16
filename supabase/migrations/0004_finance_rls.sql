-- RLS policies for finance tables

alter table public.cash_transactions enable row level security;
alter table public.employees enable row level security;
alter table public.salary_payments enable row level security;
alter table public.assets enable row level security;
alter table public.equity_snapshots enable row level security;
alter table public.working_capital_snapshots enable row level security;

-- Cash transactions policies
create policy cash_transactions_all_brand_owner
on public.cash_transactions
for all
to authenticated
using (
  exists (
    select 1 from public.brands b
    where b.id = cash_transactions.brand_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.brands b
    where b.id = cash_transactions.brand_id
      and b.owner_user_id = auth.uid()
  )
);

-- Employees policies
create policy employees_all_brand_owner
on public.employees
for all
to authenticated
using (
  exists (
    select 1 from public.brands b
    where b.id = employees.brand_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.brands b
    where b.id = employees.brand_id
      and b.owner_user_id = auth.uid()
  )
);

-- Salary payments policies
create policy salary_payments_all_brand_owner
on public.salary_payments
for all
to authenticated
using (
  exists (
    select 1 from public.brands b
    where b.id = salary_payments.brand_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.brands b
    where b.id = salary_payments.brand_id
      and b.owner_user_id = auth.uid()
  )
);

-- Assets policies
create policy assets_all_brand_owner
on public.assets
for all
to authenticated
using (
  exists (
    select 1 from public.brands b
    where b.id = assets.brand_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.brands b
    where b.id = assets.brand_id
      and b.owner_user_id = auth.uid()
  )
);

-- Equity snapshots policies
create policy equity_snapshots_all_brand_owner
on public.equity_snapshots
for all
to authenticated
using (
  exists (
    select 1 from public.brands b
    where b.id = equity_snapshots.brand_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.brands b
    where b.id = equity_snapshots.brand_id
      and b.owner_user_id = auth.uid()
  )
);

-- Working capital snapshots policies
create policy working_capital_snapshots_all_brand_owner
on public.working_capital_snapshots
for all
to authenticated
using (
  exists (
    select 1 from public.brands b
    where b.id = working_capital_snapshots.brand_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.brands b
    where b.id = working_capital_snapshots.brand_id
      and b.owner_user_id = auth.uid()
  )
);
