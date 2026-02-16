-- Add 'payment' type to notifications type constraint
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check 
  check (type in ('payment_reminder', 'performance_alert', 'payment_approval', 'payment', 'system'));

-- Add action_url column for notification links
alter table public.notifications add column if not exists action_url text;
