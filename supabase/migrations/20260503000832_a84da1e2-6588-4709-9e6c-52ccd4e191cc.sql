create table public.product_status (
  product_handle text primary key,
  out_of_stock boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.product_status enable row level security;
create policy "Anyone can read product status" on public.product_status for select using (true);
create policy "Admins can insert product status" on public.product_status for insert to authenticated with check (has_role(auth.uid(), 'admin'));
create policy "Admins can update product status" on public.product_status for update to authenticated using (has_role(auth.uid(), 'admin'));
create policy "Admins can delete product status" on public.product_status for delete to authenticated using (has_role(auth.uid(), 'admin'));