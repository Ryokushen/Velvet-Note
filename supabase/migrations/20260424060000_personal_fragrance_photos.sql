insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-fragrance-photos',
  'user-fragrance-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists user_fragrance_photos_public_read on storage.objects;
create policy user_fragrance_photos_public_read
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'user-fragrance-photos');

drop policy if exists user_fragrance_photos_owner_insert on storage.objects;
create policy user_fragrance_photos_owner_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'user-fragrance-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists user_fragrance_photos_owner_update on storage.objects;
create policy user_fragrance_photos_owner_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'user-fragrance-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'user-fragrance-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists user_fragrance_photos_owner_delete on storage.objects;
create policy user_fragrance_photos_owner_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'user-fragrance-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop function if exists public.list_fragrances_with_catalog_images();

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
    fragrances.image_url as personal_image_url,
    catalog_fragrances.image_url as catalog_image_url,
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
