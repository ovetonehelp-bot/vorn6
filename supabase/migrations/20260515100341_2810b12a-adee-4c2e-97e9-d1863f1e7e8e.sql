
create table public.site_config (
  id text primary key default 'singleton',
  mode text not null default 'countdown',
  launch_at timestamptz not null default '2026-06-15T12:00:00Z',
  updated_at timestamptz not null default now(),
  constraint site_config_singleton check (id = 'singleton'),
  constraint site_config_mode_check check (mode in ('countdown','live'))
);

alter table public.site_config enable row level security;

create policy "Anyone can read site config" on public.site_config for select using (true);
create policy "Admins can insert site config" on public.site_config for insert to authenticated with check (has_role(auth.uid(), 'admin'));
create policy "Admins can update site config" on public.site_config for update to authenticated using (has_role(auth.uid(), 'admin'));

insert into public.site_config (id, mode, launch_at) values ('singleton', 'countdown', '2026-06-15T12:00:00Z')
on conflict (id) do nothing;

create table public.coming_soon_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  country text,
  region text,
  city text,
  created_at timestamptz not null default now()
);

alter table public.coming_soon_leads enable row level security;

create policy "Anyone can insert coming soon lead" on public.coming_soon_leads for insert with check (true);
create policy "Admins can read coming soon leads" on public.coming_soon_leads for select to authenticated using (has_role(auth.uid(), 'admin'));
create policy "Admins can delete coming soon leads" on public.coming_soon_leads for delete to authenticated using (has_role(auth.uid(), 'admin'));
