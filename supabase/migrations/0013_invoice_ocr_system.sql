-- Invoice OCR System Migration
-- Adds invoice attachments, line items, and OCR metadata to costs and revenues

-- Add attachment and OCR fields to manual_revenues
alter table public.manual_revenues 
  add column if not exists attachment_url text,
  add column if not exists attachment_storage_path text,
  add column if not exists ocr_confidence numeric(3,2) check (ocr_confidence >= 0 and ocr_confidence <= 1),
  add column if not exists ocr_extracted_data jsonb,
  add column if not exists invoice_number text,
  add column if not exists invoice_currency text,
  add column if not exists invoice_subtotal numeric(12,2),
  add column if not exists invoice_tax numeric(12,2),
  add column if not exists invoice_total numeric(12,2);

-- Add photo_url column (was mentioned in UI but not in schema)
alter table public.manual_revenues
  add column if not exists photo_url text;

-- Add attachment and OCR fields to costs
alter table public.costs
  add column if not exists attachment_url text,
  add column if not exists attachment_storage_path text,
  add column if not exists ocr_confidence numeric(3,2) check (ocr_confidence >= 0 and ocr_confidence <= 1),
  add column if not exists ocr_extracted_data jsonb,
  add column if not exists invoice_number text,
  add column if not exists invoice_currency text,
  add column if not exists invoice_subtotal numeric(12,2),
  add column if not exists invoice_tax numeric(12,2),
  add column if not exists invoice_total numeric(12,2);

-- Revenue line items table
create table if not exists public.revenue_line_items (
  id uuid primary key default gen_random_uuid(),
  revenue_id uuid not null references public.manual_revenues(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  item_name text not null,
  description text,
  quantity numeric(12,3) not null default 1,
  unit_price numeric(12,2) not null,
  line_total numeric(12,2) not null,
  sku text,
  tax_amount numeric(12,2),
  discount_amount numeric(12,2),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger revenue_line_items_set_updated_at
before update on public.revenue_line_items
for each row execute function public.set_updated_at();

create index if not exists revenue_line_items_revenue_idx on public.revenue_line_items(revenue_id);
create index if not exists revenue_line_items_brand_idx on public.revenue_line_items(brand_id);

-- Cost line items table
create table if not exists public.cost_line_items (
  id uuid primary key default gen_random_uuid(),
  cost_id uuid not null references public.costs(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  item_name text not null,
  description text,
  quantity numeric(12,3) not null default 1,
  unit_price numeric(12,2) not null,
  line_total numeric(12,2) not null,
  sku text,
  tax_amount numeric(12,2),
  discount_amount numeric(12,2),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger cost_line_items_set_updated_at
before update on public.cost_line_items
for each row execute function public.set_updated_at();

create index if not exists cost_line_items_cost_idx on public.cost_line_items(cost_id);
create index if not exists cost_line_items_brand_idx on public.cost_line_items(brand_id);

-- OCR processing log table (for debugging and audit)
create table if not exists public.ocr_processing_logs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('cost', 'revenue')),
  transaction_id uuid,
  file_name text,
  file_size_bytes bigint,
  processing_status text not null check (processing_status in ('pending', 'processing', 'success', 'partial', 'failed')),
  confidence_overall numeric(3,2),
  extracted_data jsonb,
  error_message text,
  processing_time_ms int,
  created_at timestamptz not null default now()
);

create index if not exists ocr_logs_brand_idx on public.ocr_processing_logs(brand_id, created_at desc);
create index if not exists ocr_logs_transaction_idx on public.ocr_processing_logs(transaction_type, transaction_id);

-- Enable RLS
alter table public.revenue_line_items enable row level security;
alter table public.cost_line_items enable row level security;
alter table public.ocr_processing_logs enable row level security;

-- RLS policies for revenue_line_items
create policy revenue_line_items_brand_owner on public.revenue_line_items for all to authenticated
using (exists (select 1 from public.brands b where b.id = revenue_line_items.brand_id and b.owner_user_id = auth.uid()))
with check (exists (select 1 from public.brands b where b.id = revenue_line_items.brand_id and b.owner_user_id = auth.uid()));

-- RLS policies for cost_line_items
create policy cost_line_items_brand_owner on public.cost_line_items for all to authenticated
using (exists (select 1 from public.brands b where b.id = cost_line_items.brand_id and b.owner_user_id = auth.uid()))
with check (exists (select 1 from public.brands b where b.id = cost_line_items.brand_id and b.owner_user_id = auth.uid()));

-- RLS policies for ocr_processing_logs
create policy ocr_logs_brand_owner on public.ocr_processing_logs for all to authenticated
using (exists (select 1 from public.brands b where b.id = ocr_processing_logs.brand_id and b.owner_user_id = auth.uid()))
with check (exists (select 1 from public.brands b where b.id = ocr_processing_logs.brand_id and b.owner_user_id = auth.uid()));
