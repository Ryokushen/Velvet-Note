create table if not exists public.catalog_barcode_submissions (
  id uuid primary key default gen_random_uuid(),
  barcode text not null check (barcode ~ '^[0-9]{8,14}$'),
  catalog_fragrance_id uuid not null references public.catalog_fragrances(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  source text not null default 'app_scan',
  reviewer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (barcode, catalog_fragrance_id, user_id)
);

create index if not exists catalog_barcode_submissions_pending_idx
  on public.catalog_barcode_submissions(status, created_at);

create index if not exists catalog_barcode_submissions_user_idx
  on public.catalog_barcode_submissions(user_id, created_at desc);

create index if not exists catalog_barcode_submissions_catalog_fragrance_id_idx
  on public.catalog_barcode_submissions(catalog_fragrance_id);

alter table public.catalog_barcode_submissions enable row level security;

drop policy if exists catalog_barcode_submissions_insert_own on public.catalog_barcode_submissions;
create policy catalog_barcode_submissions_insert_own
  on public.catalog_barcode_submissions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists catalog_barcode_submissions_select_own on public.catalog_barcode_submissions;
create policy catalog_barcode_submissions_select_own
  on public.catalog_barcode_submissions
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace trigger catalog_barcode_submissions_set_updated_at
  before update on public.catalog_barcode_submissions
  for each row execute function public.set_updated_at();
