-- Upsert Parfumo staging rows into catalog_fragrances.
--
-- Run after:
--   1. supabase/migrations/20260424010000_catalog_fragrances.sql has been applied
--   2. parfumo_seed.csv has been copied into catalog_fragrances_staging

with typed as (
  select
    nullif(parfumo_url, '') as parfumo_url,
    nullif(brand, '') as brand,
    nullif(name, '') as name,
    nullif(release_year, '')::int as release_year,
    nullif(concentration, '') as concentration,
    nullif(raw_concentration, '') as raw_concentration,
    case
      when coalesce(accords_pipe, '') = '' then '{}'::text[]
      else string_to_array(accords_pipe, '|')
    end as accords,
    case
      when coalesce(notes_top_pipe, '') = '' then '{}'::text[]
      else string_to_array(notes_top_pipe, '|')
    end as notes_top,
    case
      when coalesce(notes_middle_pipe, '') = '' then '{}'::text[]
      else string_to_array(notes_middle_pipe, '|')
    end as notes_middle,
    case
      when coalesce(notes_base_pipe, '') = '' then '{}'::text[]
      else string_to_array(notes_base_pipe, '|')
    end as notes_base,
    case
      when coalesce(perfumers_pipe, '') = '' then '{}'::text[]
      else string_to_array(perfumers_pipe, '|')
    end as perfumers,
    nullif(rating_value, '')::numeric as rating_value,
    nullif(rating_count, '')::int as rating_count
  from catalog_fragrances_staging
  where nullif(parfumo_url, '') is not null
    and nullif(brand, '') is not null
    and nullif(name, '') is not null
),
deduped as (
  select distinct on (parfumo_url)
    parfumo_url,
    brand,
    name,
    release_year,
    concentration,
    raw_concentration,
    accords,
    notes_top,
    notes_middle,
    notes_base,
    perfumers,
    rating_value,
    rating_count
  from typed
  order by parfumo_url, rating_count desc nulls last, rating_value desc nulls last
)
insert into catalog_fragrances (
  parfumo_url,
  brand,
  name,
  release_year,
  concentration,
  raw_concentration,
  accords,
  notes_top,
  notes_middle,
  notes_base,
  perfumers,
  rating_value,
  rating_count
)
select
  parfumo_url,
  brand,
  name,
  release_year,
  concentration,
  raw_concentration,
  accords,
  notes_top,
  notes_middle,
  notes_base,
  perfumers,
  rating_value,
  rating_count
from deduped
on conflict (parfumo_url) do update set
  brand = excluded.brand,
  name = excluded.name,
  release_year = excluded.release_year,
  concentration = excluded.concentration,
  raw_concentration = excluded.raw_concentration,
  accords = excluded.accords,
  notes_top = excluded.notes_top,
  notes_middle = excluded.notes_middle,
  notes_base = excluded.notes_base,
  perfumers = excluded.perfumers,
  rating_value = excluded.rating_value,
  rating_count = excluded.rating_count,
  imported_at = now();

select
  count(*) as total_rows,
  count(release_year) as with_year,
  count(concentration) as with_concentration,
  count(*) filter (where array_length(accords, 1) > 0) as with_accords,
  count(*) filter (where array_length(notes_top, 1) > 0) as with_top_notes,
  count(*) filter (where array_length(notes_middle, 1) > 0) as with_middle_notes,
  count(*) filter (where array_length(notes_base, 1) > 0) as with_base_notes,
  count(rating_value) as with_rating
from catalog_fragrances
where source = 'parfumo_tidytuesday_2024_12_10';

truncate table catalog_fragrances_staging;
