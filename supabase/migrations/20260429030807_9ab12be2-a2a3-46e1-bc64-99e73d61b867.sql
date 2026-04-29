
-- Roles enum and table
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users can view their own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can view all roles"
on public.user_roles for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Auto-grant admin role on signup for the designated admin email
create or replace function public.handle_admin_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email = 'ovetonehelp@gmail.com' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created_admin
after insert on auth.users
for each row execute function public.handle_admin_signup();

-- Allow admins to read discount_leads
create policy "Admins can read leads"
on public.discount_leads for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));
