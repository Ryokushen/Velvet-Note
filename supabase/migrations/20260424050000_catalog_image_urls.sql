alter table catalog_fragrances
  add column if not exists image_url text,
  add column if not exists image_scraped_at timestamptz,
  add column if not exists image_scrape_status text;

do $$
begin
  alter table catalog_fragrances
    add constraint catalog_fragrances_image_scrape_status_check
    check (image_scrape_status in ('ok', 'not_found', 'error'));
exception
  when duplicate_object then null;
end $$;

create index if not exists catalog_fragrances_pending_image_idx
  on catalog_fragrances (rating_count desc nulls last)
  where image_scrape_status is null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fragrance-images',
  'fragrance-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists fragrance_images_public_read on storage.objects;
create policy fragrance_images_public_read
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'fragrance-images');

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
  image_url text,
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
    candidates.image_url,
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
  catalog_description text,
  catalog_source text,
  catalog_release_year int,
  catalog_notes_top text[],
  catalog_notes_middle text[],
  catalog_notes_base text[],
  catalog_perfumers text[],
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
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
    fragrances.catalog_description,
    fragrances.catalog_source,
    fragrances.catalog_release_year,
    fragrances.catalog_notes_top,
    fragrances.catalog_notes_middle,
    fragrances.catalog_notes_base,
    fragrances.catalog_perfumers,
    fragrances.created_at,
    fragrances.updated_at
  from fragrances
  left join catalog_fragrances
    on fragrances.catalog_id = catalog_fragrances.id::text
  where fragrances.user_id = auth.uid()
  order by fragrances.created_at desc;
$$;

grant execute on function public.list_fragrances_with_catalog_images() to authenticated;
