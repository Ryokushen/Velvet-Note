create table if not exists public.catalog_barcodes (
  barcode text primary key,
  barcode_type text not null default 'unknown'
    check (barcode_type in ('upc_a', 'ean_8', 'ean_13', 'gtin_14', 'unknown')),
  catalog_fragrance_id uuid not null references public.catalog_fragrances(id) on delete cascade,
  product_label text,
  size_text text,
  source text not null,
  confidence numeric not null default 0.5 check (confidence >= 0 and confidence <= 1),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (barcode ~ '^[0-9]{8,14}$')
);

create index if not exists catalog_barcodes_catalog_fragrance_id_idx
  on public.catalog_barcodes(catalog_fragrance_id);

create index if not exists catalog_barcodes_confidence_idx
  on public.catalog_barcodes(verified desc, confidence desc);

alter table public.catalog_barcodes enable row level security;

drop policy if exists catalog_barcodes_public_read on public.catalog_barcodes;
create policy catalog_barcodes_public_read
  on public.catalog_barcodes
  for select
  to anon, authenticated
  using (true);

create or replace trigger catalog_barcodes_set_updated_at
  before update on public.catalog_barcodes
  for each row execute function public.set_updated_at();

create or replace function public.find_catalog_fragrance_by_barcode(
  barcode_text text
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
  with normalized as (
    select regexp_replace(coalesce(barcode_text, ''), '\D', '', 'g') as barcode
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
    catalog_fragrances.release_year,
    catalog_fragrances.perfumers,
    catalog_fragrances.rating_value,
    catalog_fragrances.rating_count,
    catalog_fragrances.image_url,
    catalog_fragrances.source
  from normalized
  join public.catalog_barcodes
    on catalog_barcodes.barcode = normalized.barcode
  join public.catalog_fragrances
    on catalog_fragrances.id = catalog_barcodes.catalog_fragrance_id
  where length(normalized.barcode) between 8 and 14
  order by
    catalog_barcodes.verified desc,
    catalog_barcodes.confidence desc,
    catalog_barcodes.updated_at desc
  limit 1;
$$;

grant execute on function public.find_catalog_fragrance_by_barcode(text) to anon, authenticated;
