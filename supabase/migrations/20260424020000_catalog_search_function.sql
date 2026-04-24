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
  source text
)
language sql
stable
set search_path = public
as $$
  with query as (
    select lower(trim(search_text)) as term
  )
  select
    catalog_fragrances.id,
    catalog_fragrances.brand,
    catalog_fragrances.name,
    catalog_fragrances.concentration,
    catalog_fragrances.accords,
    catalog_fragrances.notes_top,
    catalog_fragrances.notes_middle,
    catalog_fragrances.notes_base,
    catalog_fragrances.source
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
  order by
    catalog_fragrances.rating_count desc nulls last,
    catalog_fragrances.rating_value desc nulls last,
    catalog_fragrances.brand,
    catalog_fragrances.name
  limit least(greatest(match_limit, 1), 25);
$$;

grant execute on function public.search_catalog_fragrances(text, int) to anon, authenticated;
