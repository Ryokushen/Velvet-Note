create extension if not exists "pgcrypto";

create table if not exists catalog_fragrances_staging (
  parfumo_url text,
  brand text,
  name text,
  release_year text,
  concentration text,
  raw_concentration text,
  accords_pipe text,
  notes_top_pipe text,
  notes_middle_pipe text,
  notes_base_pipe text,
  perfumers_pipe text,
  rating_value text,
  rating_count text
);

alter table catalog_fragrances_staging enable row level security;

revoke all on table catalog_fragrances_staging from anon, authenticated;

create table if not exists catalog_fragrances (
  id uuid primary key default gen_random_uuid(),
  parfumo_url text unique not null,
  brand text not null,
  name text not null,
  release_year int,
  concentration text check (concentration in ('EDT', 'EDP', 'Parfum', 'Cologne', 'Other')),
  raw_concentration text,
  accords text[] not null default '{}',
  notes_top text[] not null default '{}',
  notes_middle text[] not null default '{}',
  notes_base text[] not null default '{}',
  perfumers text[] not null default '{}',
  rating_value numeric,
  rating_count int,
  source text not null default 'parfumo_tidytuesday_2024_12_10',
  imported_at timestamptz not null default now()
);

create index if not exists catalog_fragrances_brand_name_idx
  on catalog_fragrances (lower(brand), lower(name));

create index if not exists catalog_fragrances_rating_count_idx
  on catalog_fragrances (rating_count desc nulls last);

create index if not exists catalog_fragrances_accords_gin
  on catalog_fragrances using gin (accords);

create index if not exists catalog_fragrances_notes_top_gin
  on catalog_fragrances using gin (notes_top);

create index if not exists catalog_fragrances_notes_middle_gin
  on catalog_fragrances using gin (notes_middle);

create index if not exists catalog_fragrances_notes_base_gin
  on catalog_fragrances using gin (notes_base);

alter table catalog_fragrances enable row level security;

drop policy if exists catalog_fragrances_read_all on catalog_fragrances;
create policy catalog_fragrances_read_all
  on catalog_fragrances
  for select
  using (true);

grant select on table catalog_fragrances to anon, authenticated;
