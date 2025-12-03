alter table public.users enable row level security;

create policy "Users can see themselves"
  on public.users
  for select
  using (auth.uid() = id);

create policy "Admins can see all users"
  on public.users
  for select
  using (exists(select 1 from public.admins where admins.user_id = auth.uid()));
