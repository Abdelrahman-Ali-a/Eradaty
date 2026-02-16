alter table public.brands enable row level security;
alter table public.costs enable row level security;
alter table public.shopify_connections enable row level security;
alter table public.shopify_orders enable row level security;
alter table public.meta_connections enable row level security;
alter table public.meta_daily_spend enable row level security;

create policy brands_select_own
on public.brands
for select
to authenticated
using (owner_user_id = auth.uid());

create policy brands_insert_own
on public.brands
for insert
to authenticated
with check (owner_user_id = auth.uid());

create policy brands_update_own
on public.brands
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy brands_delete_own
on public.brands
for delete
to authenticated
using (owner_user_id = auth.uid());

create policy costs_all_brand_owner
on public.costs
for all
to authenticated
using (
  exists (
    select 1 from public.brands b
    where b.id = costs.brand_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.brands b
    where b.id = costs.brand_id
      and b.owner_user_id = auth.uid()
  )
);

create policy shopify_connections_all_brand_owner
on public.shopify_connections
for all
to authenticated
using (
  exists (
    select 1 from public.brands b
    where b.id = shopify_connections.brand_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.brands b
    where b.id = shopify_connections.brand_id
      and b.owner_user_id = auth.uid()
  )
);

create policy shopify_orders_all_brand_owner
on public.shopify_orders
for all
to authenticated
using (
  exists (
    select 1 from public.brands b
    where b.id = shopify_orders.brand_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.brands b
    where b.id = shopify_orders.brand_id
      and b.owner_user_id = auth.uid()
  )
);

create policy meta_connections_all_brand_owner
on public.meta_connections
for all
to authenticated
using (
  exists (
    select 1 from public.brands b
    where b.id = meta_connections.brand_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.brands b
    where b.id = meta_connections.brand_id
      and b.owner_user_id = auth.uid()
  )
);

create policy meta_daily_spend_all_brand_owner
on public.meta_daily_spend
for all
to authenticated
using (
  exists (
    select 1 from public.brands b
    where b.id = meta_daily_spend.brand_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.brands b
    where b.id = meta_daily_spend.brand_id
      and b.owner_user_id = auth.uid()
  )
);
