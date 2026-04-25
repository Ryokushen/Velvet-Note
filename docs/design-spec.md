---
tags:
  - project
type: spec
status: approved
date: 2026-04-24
---

# Fragrance App - Design Spec

Index: [[Fragrance App Index]]

## Overview

Status note, 2026-04-25: Phase 1.5 includes wear logging, Calendar month/by-bottle views, same-day wear counts, selected-date wear entry/edit/confirmed delete, and curated accord autocomplete. Phase 2 catalog foundation is also live: the shared Supabase catalog seed is loaded and searchable by brand, bottle name, accords, and notes, with release year, perfumer, and top/heart/base note metadata surfaced in the app. Community ratings stay out of the personal UI so the user's own rating remains primary. Barcode scanning now has a dedicated route, exact barcode lookup, pending user submissions for unknown barcode links, admin-gated RPCs to approve or reject submitted links, and a hidden `/barcode-review` route for review. LLM fallback remains a Phase 2 follow-up.

A personal fragrance collection tracker. Mobile-first (Expo / React Native, iOS + Android), backed by Supabase. Core job: remember what I own — a searchable catalog of my bottles with brand, name, concentration, accords, and a personal rating. Shipped in phases so real usage drives what gets built next.

## Motivation

I own a fragrance collection and track nothing. Everything is in my head, and the recall gets worse as the collection grows. Existing apps (Fragrantica, Parfumo, Scentbird) either don't fit how I think or require subscriptions / don't focus on personal catalog management. I want a lean mobile app that makes my own collection fast to browse and filter, starting minimal and adding features I actually miss once the basics are in use.

## Name & Aesthetic Direction

**Product name:** *Velvet Note*.
**Internal name:** Fragrance App still appears in package/file names and older docs.

**Aesthetic intent:** Build UI/UX toward the higher-end "collector's companion" feel that *Velvet Note* implies — not a spreadsheet for perfumes. Even though Phase 1 is a minimal catalog, design choices from day one should bias toward:

- Generous whitespace and refined typography (serif or editorial sans for headings)
- Restrained color palette — deep neutrals, a single accent
- Tactile, subtle motion rather than flashy animation
- Fragrance detail pages that feel like a curated card, not a data form

This keeps Phase 1 minimal in scope while setting visual groundwork that the eventual name can live inside.

## Core Concept

Catalog-first. The app is primarily a searchable list of bottles I own. Everything else (wear calendar, barcode scanning, scent lookups) orbits around that list.

Key decisions made during brainstorming:

- **Mobile-first** - Expo / React Native, not a vault-native or web-first app
- **Publishable someday** - architecture must support multi-user from day one (Supabase RLS), even though I'm the only user initially
- **Text-search entry** - shipped through the shared Supabase catalog RPC.
- **Barcode entry** - still planned for Phase 2. Not manual-only long-term.
- **Curated-seed fragrance DB + LLM fallback** - Parfumo seed is live; LLM fallback remains a Phase 2 follow-up.
- **Offline-first** - eventually (Phase 3). Not day one.
- **Lean schema** - only the fields I'd actually search by: brand, name, concentration, accords, rating.

## Architecture

### Stack

- **Client:** Expo (React Native) with Expo Router for file-based navigation. TypeScript.
- **Backend:** Supabase - Postgres, Auth, Row-Level Security.
- **Data layer:** Supabase JS client directly. React Query for caching and mutations.
- **Offline sync (Phase 3):** WatermelonDB or PowerSync on top of local SQLite.
- **Barcode (Phase 2):** `expo-barcode-scanner` + Expo Camera.

### Repo

- Windows location: `C:\Users\charl\Artificial\Obsidian\Obsidian Vault\Velvet-Note`
- GitHub: `https://github.com/Ryokushen/Velvet-Note`
- Historical vault note hub: `Projects/Fragrance App.md`

### Distribution

- **Dev:** Expo Go on my phone, Metro bundler on my dev machine
- **Phase 1:** personal only, no store distribution
- **Phase 4 (optional):** Expo EAS Build → TestFlight + Play internal testing → App Store submission

## Data Model

Phase 1 uses a single user-scoped table. Phase 1.5 adds wears. Phase 2 adds a shared catalog.

### Phase 1: `fragrances`

```sql
create table fragrances (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  brand         text not null,
  name          text not null,
  concentration text check (concentration in ('EDT','EDP','Parfum','Cologne','Other')),
  accords       text[] default '{}',
  rating        numeric check (rating >= 0 and rating <= 10),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table fragrances enable row level security;

create policy "fragrances_owner_select" on fragrances
  for select using (auth.uid() = user_id);
create policy "fragrances_owner_insert" on fragrances
  for insert with check (auth.uid() = user_id);
create policy "fragrances_owner_update" on fragrances
  for update using (auth.uid() = user_id);
create policy "fragrances_owner_delete" on fragrances
  for delete using (auth.uid() = user_id);
```

### Phase 1.5: `wears`

```sql
create table wears (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  fragrance_id  uuid not null references fragrances(id) on delete cascade,
  worn_on       date not null default current_date,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index wears_user_worn_on_idx on wears(user_id, worn_on desc, created_at desc);
create index wears_fragrance_worn_on_idx on wears(fragrance_id, worn_on desc, created_at desc);

alter table wears enable row level security;
-- owner-only policies mirror fragrances, with insert/update checks that the fragrance belongs to the same user
```

Accords stay as `text[]` for simplicity in Phase 1. If the set becomes messy in real use, Phase 2 can normalize into a controlled dimension table plus a join table.

### Phase 2: `catalog_fragrances`

The shared read-only catalog is seeded from the Parfumo TidyTuesday 2024-12-10 snapshot. It stays separate from user-owned shelf rows.

```sql
create table catalog_fragrances (
  id uuid primary key default gen_random_uuid(),
  parfumo_url text unique not null,
  brand text not null,
  name text not null,
  release_year int,
  concentration text check (concentration in ('EDT', 'EDP', 'Parfum', 'Cologne', 'Other')),
  raw_concentration text,
  accords text[] not null default '{}',
  notes_top text[] not null default '{}',
  notes_middle text[] not null default '{}',
  notes_base text[] not null default '{}',
  perfumers text[] not null default '{}',
  rating_value numeric,
  rating_count int,
  image_url text,
  image_scraped_at timestamptz,
  image_scrape_status text check (image_scrape_status in ('ok', 'not_found', 'error')),
  source text not null default 'parfumo_tidytuesday_2024_12_10',
  imported_at timestamptz not null default now()
);
```

Barcode scan linkage is intentionally separate from `catalog_fragrances`:

```sql
create table catalog_barcodes (
  barcode text primary key,
  barcode_type text not null,
  catalog_fragrance_id uuid not null references catalog_fragrances(id),
  product_label text,
  size_text text,
  source text not null,
  confidence numeric not null default 0.5,
  verified boolean not null default false
);
```

Unknown barcode links are staged before they become shared matches:

```sql
create table catalog_barcode_submissions (
  id uuid primary key default gen_random_uuid(),
  barcode text not null,
  catalog_fragrance_id uuid not null references catalog_fragrances(id),
  user_id uuid not null default auth.uid() references auth.users(id),
  status text not null default 'pending',
  source text not null default 'app_scan',
  reviewer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

`catalog_fragrances` is public-read through RLS and searched through `search_catalog_fragrances(search_text, match_limit)`, which ranks exact brand/name matches, exact accord/note matches, note position, then rating popularity. `catalog_barcodes` is also public-read and resolves scans through `find_catalog_fragrance_by_barcode(barcode_text)`. Unknown barcode scans create authenticated, user-owned rows in `catalog_barcode_submissions`. Trusted users are allowlisted in `app_admins`; admin-gated RPCs list pending submissions, approve them into `catalog_barcodes`, or reject them with a reviewer note. Catalog image URLs are nullable and intended for scraper/backfilled enrichment through the `fragrance-images` Supabase Storage bucket. User-owned `fragrances` rows can store optional catalog metadata (`catalog_id`, `image_url`, `catalog_description`, `catalog_source`) without making catalog rows user-owned. App shelf reads use `list_fragrances_with_catalog_images()`, which returns a user photo first and falls back to the linked catalog image.

## Phased Roadmap

### Phase 1 — Collection MVP

Scope:

- Expo app scaffolded, Supabase project provisioned
- Auth: email + password. Apple Sign In and Google Sign In are deferred to Phase 4.
- Four screens:
  - `app/(auth)/sign-in.tsx`
  - `app/(tabs)/index.tsx` — collection list
  - `app/(tabs)/add.tsx` — add form
  - `app/fragrance/[id].tsx` — detail + edit + delete
- Table: `fragrances` with RLS
- Online-only, no caching beyond what React Query provides
- Deploy: Expo Go on my phone

Collection list behavior:

- Sorted by rating desc by default; toggle to recently added
- Search box filters client-side by brand, name, or accord
- Each row shows brand + name as primary; concentration + rating as secondary
- Floating "+" button to add
- Empty state: "No fragrances yet — tap + to add your first"

Add form fields:

- Brand (required)
- Name (required)
- Concentration picker (EDT / EDP / Parfum / Cologne / Other)
- Accords as free-text chips
- Rating slider (0–10, 0.5 step)

Detail screen:

- Read-only by default; tap Edit to convert to editable form
- Delete with confirm modal

### Phase 1.5 — Wear Calendar

Scope:

- New table: `wears`
- Fragrance detail screen logs today's wear with an optional note
- New Calendar tab between Collection and Add
- Month grid marks days with wears, counts multiple same-day wears, and shows a selected-day detail sheet
- By bottle segmented view shows last-worn status and a compact sparkline
- Selected-date day-sheet wear logging, editing, and deletion are implemented

### Phase 2 — Barcode + DB Lookup

Scope:

- Shipped: shared public-read `catalog_fragrances` table seeded from Parfumo.
- Shipped: Add flow searches Supabase via `search_catalog_fragrances(search_text, match_limit)`.
- Shipped: selected catalog metadata can persist on user-owned shelf rows.
- Shipped: richer catalog fields surface in the app, including top/middle/base notes, year, and perfumers. Community ratings remain catalog-only and are not shown next to personal ratings.
- Shipped: catalog image infrastructure is live for scraper backfill, including `catalog_fragrances.image_url`, scrape status fields, the `fragrance-images` Storage bucket, and shelf fallback from user photo to catalog image.
- Shipped: personal photo upload from device media for user-owned shelf rows using the `user-fragrance-photos` Storage bucket.
- Shipped: barcode DB contract through `catalog_barcodes` and `find_catalog_fragrance_by_barcode(barcode_text)`.
- Shipped: dedicated `/scan` camera route wired to barcode lookup and Add prefill.
- Shipped: unknown barcode linking creates pending user submissions through `catalog_barcode_submissions`.
- Shipped: admin-gated review RPCs can approve submitted barcode links into `catalog_barcodes` or reject them.
- Shipped: hidden `/barcode-review` route lists pending submissions and calls the approve/reject helpers.
- Next: apply pending barcode migrations to live Supabase and smoke-test the scanner/review loop.
- Later: LLM fallback for unknown entries, generating accord/note suggestions that the user confirms before saving.

### Phase 3 — Offline-First

Scope:

- Local SQLite via WatermelonDB or PowerSync
- Background sync, last-write-wins conflict resolution
- Works on airplane mode, syncs on reconnect

### Phase 4 — Publish (optional)

Scope:

- Expo EAS Build for iOS + Android
- TestFlight + Play internal testing
- App Store and Play Store submission
- CI via GitHub Actions + EAS

## Error Handling

Phase 1 scope:

- **Auth failures** — inline errors on the sign-in screen. Supabase error codes mapped to friendly messages.
- **Network failures on mutations** — toast "Couldn't save, try again". Form stays filled so no input is lost.
- **Network failures on reads** — React Query caches last snapshot. If nothing cached, empty state with retry.
- **Validation** — client-side checks (brand + name required, rating 0–10) before hitting Supabase. Postgres `check` constraints are the backstop.
- **RLS failures** — should never happen with correct auth. If one does, log and force sign-out.

## Testing

Phase 1 scope:

- **Unit tests** (Jest + React Native Testing Library) for pure functions: rating formatters, search filter, accord parser. Component tests for the add form validation.
- **Integration tests** against a local Supabase instance (`supabase start`): insert → list → edit → delete round-trip, plus RLS enforcement (user A cannot see user B's rows).
- **No E2E yet** — Detox/Maestro deferred until Phase 4.
- **Manual smoke-test checklist** documented per phase: sign in, add fragrance, list renders, edit persists, delete removes.

CI is optional in Phase 1. GitHub Actions can run typecheck + Jest on PR; EAS CI waits until Phase 4.

## Open Items / Deferred

- **Barcode scanning** — Phase 2 follow-up
- **Contribution/moderation flow** — Phase 2 follow-up
- **LLM fallback prompt design** — Phase 2 follow-up
- **Offline sync library choice** (WatermelonDB vs PowerSync vs custom) — Phase 3
- **App Store compliance checklist** — Phase 4
- **Catalog bottle image backfill** — app/database contract is ready; external scraper will populate `catalog_fragrances.image_url`
- **Personal photo upload** — app implementation and migration are ready; apply `20260424060000_personal_fragrance_photos.sql` live, then smoke-test media-library uploads
- **Wear metadata richness** (occasion, weather, longevity) — Phase 1.5 shipped with date + notes; expand only if used
