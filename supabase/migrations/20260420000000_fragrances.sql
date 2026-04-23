-- supabase/migrations/20260420000000_fragrances.sql

create table fragrances (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  brand         text not null,
  name          text not null,
  concentration text check (concentration in ('EDT','EDP','Parfum','Cologne','Other')),
  accords       text[] not null default '{}',
  rating        numeric check (rating >= 0 and rating <= 10),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index fragrances_user_id_idx on fragrances(user_id);
create index fragrances_user_rating_idx on fragrances(user_id, rating desc);

alter table fragrances enable row level security;

create policy "fragrances_owner_select" on fragrances
  for select using (auth.uid() = user_id);
create policy "fragrances_owner_insert" on fragrances
  for insert with check (auth.uid() = user_id);
create policy "fragrances_owner_update" on fragrances
  for update using (auth.uid() = user_id);
create policy "fragrances_owner_delete" on fragrances
  for delete using (auth.uid() = user_id);

create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger fragrances_set_updated_at
  before update on fragrances
  for each row execute function set_updated_at();
