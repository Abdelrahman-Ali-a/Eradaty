-- Enhanced Features Migration
-- Adds: photo upload to revenue, auto-payment for employees, notifications system

-- Add photo field to manual_revenues
alter table public.manual_revenues add column if not exists photo_url text;

-- Add auto-payment fields to employees
alter table public.employees add column if not exists auto_payment boolean not null default false;
alter table public.employees add column if not exists payment_start_date date;

-- Notifications table for AI tracking and payment reminders
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  type text not null check (type in ('payment_reminder', 'performance_alert', 'payment_approval', 'system')),
  title text not null,
  message text not null,
  data jsonb,
  read boolean not null default false,
  action_required boolean not null default false,
  action_type text check (action_type in ('approve', 'decline', 'view', null)),
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notifications_set_updated_at
before update on public.notifications
for each row execute function public.set_updated_at();

create index if not exists notifications_brand_read_idx on public.notifications (brand_id, read, created_at desc);
create index if not exists notifications_action_required_idx on public.notifications (brand_id, action_required, read);

-- Performance metrics table for AI tracking
create table if not exists public.performance_metrics (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  metric_type text not null check (metric_type in ('revenue', 'costs', 'profit', 'cash_flow', 'employee_cost')),
  period_start date not null,
  period_end date not null,
  value numeric(12,2) not null,
  previous_value numeric(12,2),
  change_percentage numeric(5,2),
  ai_insight text,
  created_at timestamptz not null default now()
);

create index if not exists performance_metrics_brand_period_idx on public.performance_metrics (brand_id, period_start, period_end);

-- RLS policies
alter table public.notifications enable row level security;
alter table public.performance_metrics enable row level security;

create policy notifications_all_brand_owner on public.notifications for all to authenticated
using (exists (select 1 from public.brands b where b.id = notifications.brand_id and b.owner_user_id = auth.uid()))
with check (exists (select 1 from public.brands b where b.id = notifications.brand_id and b.owner_user_id = auth.uid()));

create policy performance_metrics_all_brand_owner on public.performance_metrics for all to authenticated
using (exists (select 1 from public.brands b where b.id = performance_metrics.brand_id and b.owner_user_id = auth.uid()))
with check (exists (select 1 from public.brands b where b.id = performance_metrics.brand_id and b.owner_user_id = auth.uid()));
