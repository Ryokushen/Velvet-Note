alter table fragrances
  add column if not exists catalog_release_year int,
  add column if not exists catalog_notes_top text[],
  add column if not exists catalog_notes_middle text[],
  add column if not exists catalog_notes_base text[],
  add column if not exists catalog_perfumers text[],
  add column if not exists catalog_rating_value numeric,
  add column if not exists catalog_rating_count int;

drop function if exists public.search_catalog_fragrances(text, int);

create or replace function public.search_catalog_fragrances(
  search_text text,
  match_limit int default 8
)
returns table (
  id uuid,
  brand text,
  name text,
  concentration text,
  accords text[],
  notes_top text[],
  notes_middle text[],
  notes_base text[],
  release_year int,
  perfumers text[],
  rating_value numeric,
  rating_count int,
  source text
)
language sql
stable
set search_path = public
as $$
  with query as (
    select lower(trim(search_text)) as term
  ),
  candidates as (
    select
      catalog_fragrances.*,
      case
        when lower(catalog_fragrances.brand) = query.term then 0
        when lower(catalog_fragrances.name) = query.term then 0
        when lower(catalog_fragrances.brand) like query.term || '%' then 1
        when lower(catalog_fragrances.name) like query.term || '%' then 1
        when lower(catalog_fragrances.brand) like '%' || query.term || '%' then 2
        when lower(catalog_fragrances.name) like '%' || query.term || '%' then 2
        when exists (
          select 1 from unnest(catalog_fragrances.accords) as value
          where lower(value) = query.term
        ) then 3
        when exists (
          select 1 from unnest(catalog_fragrances.notes_top) as value
          where lower(value) = query.term
        ) then 4
        when exists (
          select 1 from unnest(catalog_fragrances.notes_middle) as value
          where lower(value) = query.term
        ) then 5
        when exists (
          select 1 from unnest(catalog_fragrances.notes_base) as value
          where lower(value) = query.term
        ) then 6
        else 7
      end as match_rank,
      least(
        coalesce((
          select min(ord)
          from unnest(catalog_fragrances.accords) with ordinality as value(note, ord)
          where lower(value.note) = query.term
        ), 999),
        coalesce((
          select min(ord)
          from unnest(catalog_fragrances.notes_top) with ordinality as value(note, ord)
          where lower(value.note) = query.term
        ), 999),
        coalesce((
          select min(ord)
          from unnest(catalog_fragrances.notes_middle) with ordinality as value(note, ord)
          where lower(value.note) = query.term
        ), 999),
        coalesce((
          select min(ord)
          from unnest(catalog_fragrances.notes_base) with ordinality as value(note, ord)
          where lower(value.note) = query.term
        ), 999)
      ) as match_position
    from catalog_fragrances
    cross join query
    where length(query.term) >= 2
      and (
        lower(catalog_fragrances.brand) like '%' || query.term || '%'
        or lower(catalog_fragrances.name) like '%' || query.term || '%'
        or exists (
          select 1
          from unnest(
            catalog_fragrances.accords
            || catalog_fragrances.notes_top
            || catalog_fragrances.notes_middle
            || catalog_fragrances.notes_base
          ) as note_value
          where lower(note_value) like '%' || query.term || '%'
        )
      )
  )
  select
    candidates.id,
    candidates.brand,
    candidates.name,
    candidates.concentration,
    candidates.accords,
    candidates.notes_top,
    candidates.notes_middle,
    candidates.notes_base,
    candidates.release_year,
    candidates.perfumers,
    candidates.rating_value,
    candidates.rating_count,
    candidates.source
  from candidates
  order by
    candidates.match_rank,
    candidates.match_position,
    candidates.rating_count desc nulls last,
    candidates.rating_value desc nulls last,
    candidates.brand,
    candidates.name
  limit least(greatest(match_limit, 1), 25);
$$;

grant execute on function public.search_catalog_fragrances(text, int) to anon, authenticated;
