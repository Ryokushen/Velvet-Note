alter table fragrances
  add column if not exists catalog_id text,
  add column if not exists image_url text,
  add column if not exists catalog_description text,
  add column if not exists catalog_source text;

create index if not exists fragrances_user_catalog_idx on fragrances(user_id, catalog_id);
