-- Create pending_costs table for approval workflow
create table if not exists public.pending_costs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  salary_payment_id uuid references public.salary_payments(id) on delete cascade,
  amount numeric not null,
  category text not null,
  description text,
  payment_date date not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  approved_by uuid references auth.users(id),
  approved_at timestamptz
);

-- Enable RLS
alter table public.pending_costs enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view their brand's pending costs" on public.pending_costs;
drop policy if exists "Users can insert pending costs for their brand" on public.pending_costs;
drop policy if exists "Users can update their brand's pending costs" on public.pending_costs;
drop policy if exists "Users can delete their brand's pending costs" on public.pending_costs;

-- RLS policies
create policy "Users can view their brand's pending costs"
  on public.pending_costs for select
  using (brand_id in (select id from public.brands where owner_user_id = auth.uid()));

create policy "Users can insert pending costs for their brand"
  on public.pending_costs for insert
  with check (brand_id in (select id from public.brands where owner_user_id = auth.uid()));

create policy "Users can update their brand's pending costs"
  on public.pending_costs for update
  using (brand_id in (select id from public.brands where owner_user_id = auth.uid()));

create policy "Users can delete their brand's pending costs"
  on public.pending_costs for delete
  using (brand_id in (select id from public.brands where owner_user_id = auth.uid()));

-- Create index for faster queries
create index if not exists pending_costs_brand_id_idx on public.pending_costs(brand_id);
create index if not exists pending_costs_status_idx on public.pending_costs(status);
