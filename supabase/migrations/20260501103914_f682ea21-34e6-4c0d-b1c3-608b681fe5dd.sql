create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  product_handle text,
  product_title text,
  country text,
  path text,
  session_id text,
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_type_idx on public.analytics_events(event_type);
create index if not exists analytics_events_created_idx on public.analytics_events(created_at desc);
create index if not exists analytics_events_product_idx on public.analytics_events(product_handle);
alter table public.analytics_events enable row level security;
drop policy if exists "Anyone can insert analytics" on public.analytics_events;
create policy "Anyone can insert analytics" on public.analytics_events for insert to public with check (true);
drop policy if exists "Admins can read analytics" on public.analytics_events;
create policy "Admins can read analytics" on public.analytics_events for select to authenticated using (has_role(auth.uid(), 'admin'));
alter table public.discount_leads add column if not exists country text;