-- Add API credentials to shopify_connections table
alter table public.shopify_connections add column if not exists api_key text;
alter table public.shopify_connections add column if not exists api_secret text;
alter table public.shopify_connections add column if not exists scopes text default 'read_orders,read_products';
alter table public.shopify_connections add column if not exists redirect_uri text;
