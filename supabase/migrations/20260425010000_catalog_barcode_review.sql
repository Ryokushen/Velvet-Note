create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

drop policy if exists app_admins_select_self on public.app_admins;
create policy app_admins_select_self
  on public.app_admins
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins
    where app_admins.user_id = auth.uid()
  );
$$;

grant execute on function public.is_app_admin() to authenticated;

create or replace function public.catalog_barcode_type(barcode_text text)
returns text
language sql
immutable
set search_path = public
as $$
  select case length(regexp_replace(coalesce(barcode_text, ''), '\D', '', 'g'))
    when 8 then 'ean_8'
    when 12 then 'upc_a'
    when 13 then 'ean_13'
    when 14 then 'gtin_14'
    else 'unknown'
  end;
$$;

grant execute on function public.catalog_barcode_type(text) to authenticated;

create or replace function public.list_pending_catalog_barcode_submissions(
  match_limit int default 50
)
returns table (
  id uuid,
  barcode text,
  catalog_fragrance_id uuid,
  catalog_brand text,
  catalog_name text,
  submitted_user_id uuid,
  status text,
  source text,
  reviewer_note text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return query
  select
    submissions.id,
    submissions.barcode,
    submissions.catalog_fragrance_id,
    catalog.brand as catalog_brand,
    catalog.name as catalog_name,
    submissions.user_id as submitted_user_id,
    submissions.status,
    submissions.source,
    submissions.reviewer_note,
    submissions.created_at
  from public.catalog_barcode_submissions submissions
  join public.catalog_fragrances catalog
    on catalog.id = submissions.catalog_fragrance_id
  where submissions.status = 'pending'
  order by submissions.created_at asc
  limit greatest(1, least(coalesce(match_limit, 50), 100));
end;
$$;

grant execute on function public.list_pending_catalog_barcode_submissions(int) to authenticated;

create or replace function public.approve_catalog_barcode_submission(
  submission_id uuid,
  review_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pending_submission public.catalog_barcode_submissions%rowtype;
  catalog_label text;
begin
  if not public.is_app_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select *
  into pending_submission
  from public.catalog_barcode_submissions
  where id = submission_id
    and status = 'pending'
  for update;

  if not found then
    raise exception 'Pending barcode submission not found' using errcode = 'P0002';
  end if;

  select concat_ws(' ', brand, name)
  into catalog_label
  from public.catalog_fragrances
  where id = pending_submission.catalog_fragrance_id;

  insert into public.catalog_barcodes (
    barcode,
    barcode_type,
    catalog_fragrance_id,
    product_label,
    source,
    confidence,
    verified
  )
  values (
    pending_submission.barcode,
    public.catalog_barcode_type(pending_submission.barcode),
    pending_submission.catalog_fragrance_id,
    catalog_label,
    pending_submission.source,
    0.8,
    true
  )
  on conflict (barcode) do update
  set
    barcode_type = excluded.barcode_type,
    catalog_fragrance_id = excluded.catalog_fragrance_id,
    product_label = excluded.product_label,
    source = excluded.source,
    confidence = excluded.confidence,
    verified = excluded.verified,
    updated_at = now();

  update public.catalog_barcode_submissions
  set
    status = 'approved',
    reviewer_note = nullif(trim(coalesce(review_note, '')), ''),
    updated_at = now()
  where id = pending_submission.id;
end;
$$;

grant execute on function public.approve_catalog_barcode_submission(uuid, text) to authenticated;

create or replace function public.reject_catalog_barcode_submission(
  submission_id uuid,
  review_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  update public.catalog_barcode_submissions
  set
    status = 'rejected',
    reviewer_note = nullif(trim(coalesce(review_note, '')), ''),
    updated_at = now()
  where id = submission_id
    and status = 'pending';

  if not found then
    raise exception 'Pending barcode submission not found' using errcode = 'P0002';
  end if;
end;
$$;

grant execute on function public.reject_catalog_barcode_submission(uuid, text) to authenticated;
