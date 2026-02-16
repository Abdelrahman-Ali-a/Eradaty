-- Add brand profile fields
alter table public.brands add column if not exists logo_url text;
alter table public.brands add column if not exists description text;
alter table public.brands add column if not exists theme_preference text default 'light' check (theme_preference in ('light', 'dark', 'system'));
