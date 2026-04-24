-- supabase/migrations/20260423000000_wears.sql

create table wears (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  fragrance_id  uuid not null references fragrances(id) on delete cascade,
  worn_on       date not null default current_date,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index wears_user_worn_on_idx on wears(user_id, worn_on desc, created_at desc);
create index wears_fragrance_worn_on_idx on wears(fragrance_id, worn_on desc, created_at desc);

alter table wears enable row level security;

create policy "wears_owner_select" on wears
  for select using ((select auth.uid()) = user_id);

create policy "wears_owner_insert" on wears
  for insert with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from fragrances
      where fragrances.id = wears.fragrance_id
        and fragrances.user_id = (select auth.uid())
    )
  );

create policy "wears_owner_update" on wears
  for update using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from fragrances
      where fragrances.id = wears.fragrance_id
        and fragrances.user_id = (select auth.uid())
    )
  );

create policy "wears_owner_delete" on wears
  for delete using ((select auth.uid()) = user_id);

create trigger wears_set_updated_at
  before update on wears
  for each row execute function set_updated_at();
