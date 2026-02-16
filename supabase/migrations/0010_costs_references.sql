-- Add reference columns to costs table for linking to salary payments and other sources
alter table public.costs add column if not exists reference_type text;
alter table public.costs add column if not exists reference_id uuid;

-- Create index for faster lookups
create index if not exists costs_reference_idx on public.costs(reference_type, reference_id);
