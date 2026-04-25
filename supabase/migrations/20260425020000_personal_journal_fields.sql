alter table public.fragrances
  add column if not exists bottle_status text,
  add column if not exists bottle_size_ml numeric,
  add column if not exists purchase_date date,
  add column if not exists purchase_source text,
  add column if not exists purchase_price numeric,
  add column if not exists purchase_currency text default 'USD',
  add column if not exists preferred_seasons text[],
  add column if not exists preferred_time_of_day text;

alter table public.fragrances
  drop constraint if exists fragrances_bottle_status_check,
  add constraint fragrances_bottle_status_check
    check (
      bottle_status is null
      or bottle_status in ('full', 'partial', 'sample', 'decant', 'empty', 'wishlist', 'sold', 'gifted')
    ),
  drop constraint if exists fragrances_bottle_size_ml_check,
  add constraint fragrances_bottle_size_ml_check
    check (bottle_size_ml is null or bottle_size_ml > 0),
  drop constraint if exists fragrances_purchase_price_check,
  add constraint fragrances_purchase_price_check
    check (purchase_price is null or purchase_price >= 0),
  drop constraint if exists fragrances_preferred_time_of_day_check,
  add constraint fragrances_preferred_time_of_day_check
    check (preferred_time_of_day is null or preferred_time_of_day in ('day', 'night', 'either'));

alter table public.wears
  add column if not exists season text,
  add column if not exists time_of_day text,
  add column if not exists occasion text,
  add column if not exists compliment_count int default 0,
  add column if not exists compliment_note text;

alter table public.wears
  drop constraint if exists wears_season_check,
  add constraint wears_season_check
    check (season is null or season in ('spring', 'summer', 'fall', 'winter')),
  drop constraint if exists wears_time_of_day_check,
  add constraint wears_time_of_day_check
    check (time_of_day is null or time_of_day in ('day', 'night')),
  drop constraint if exists wears_compliment_count_check,
  add constraint wears_compliment_count_check
    check (compliment_count is null or compliment_count >= 0);

create or replace function public.list_fragrances_with_catalog_images()
returns table (
  id uuid,
  user_id uuid,
  brand text,
  name text,
  concentration text,
  accords text[],
  rating numeric,
  catalog_id text,
  image_url text,
  personal_image_url text,
  catalog_image_url text,
  catalog_description text,
  catalog_source text,
  catalog_release_year int,
  catalog_notes_top text[],
  catalog_notes_middle text[],
  catalog_notes_base text[],
  catalog_perfumers text[],
  bottle_status text,
  bottle_size_ml numeric,
  purchase_date date,
  purchase_source text,
  purchase_price numeric,
  purchase_currency text,
  preferred_seasons text[],
  preferred_time_of_day text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    fragrances.id,
    fragrances.user_id,
    fragrances.brand,
    fragrances.name,
    fragrances.concentration,
    fragrances.accords,
    fragrances.rating,
    fragrances.catalog_id,
    coalesce(fragrances.image_url, catalog_fragrances.image_url) as image_url,
    fragrances.image_url as personal_image_url,
    catalog_fragrances.image_url as catalog_image_url,
    fragrances.catalog_description,
    fragrances.catalog_source,
    fragrances.catalog_release_year,
    fragrances.catalog_notes_top,
    fragrances.catalog_notes_middle,
    fragrances.catalog_notes_base,
    fragrances.catalog_perfumers,
    fragrances.bottle_status,
    fragrances.bottle_size_ml,
    fragrances.purchase_date,
    fragrances.purchase_source,
    fragrances.purchase_price,
    fragrances.purchase_currency,
    fragrances.preferred_seasons,
    fragrances.preferred_time_of_day,
    fragrances.created_at,
    fragrances.updated_at
  from public.fragrances
  left join public.catalog_fragrances
    on fragrances.catalog_id = catalog_fragrances.id::text
  where fragrances.user_id = auth.uid()
  order by fragrances.created_at desc;
$$;

grant execute on function public.list_fragrances_with_catalog_images() to authenticated;
