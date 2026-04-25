---
tags:
  - project
type: status
status: shipped
date: 2026-04-24
---

# Fragrance App - Phase 1.5 Status

Index: [[Fragrance App Index]]

## Current State

Phase 1.5 wear logging and the Wears UI are shipped on `main`. The route is still `app/(tabs)/calendar.tsx` to avoid route churn, but the product label is now Wears. Day-sheet logging for arbitrary selected dates and curated accord autocomplete were added after the initial Phase 1.5 shipment. Catalog lookup has moved beyond this phase: the local Kaggle lookup was superseded by the Phase 2 shared Supabase catalog search path, catalog image infrastructure is ready for scraper backfill, and self-attached personal photo upload is implemented locally. The personal journal roadmap slice is implemented locally and extends this phase with richer wear context, a new Today tab for the active current-day wear, plus a new Insights tab.

Shipped:

- `wears` Supabase table with RLS, owner checks, indexes, and `updated_at` trigger.
- Wear data layer: `types/wear.ts`, `lib/wears.ts`, `hooks/useWears.ts`.
- Service tests in `__tests__/wears.test.ts`.
- Fragrance detail "Log today" flow with optional note, season, day/night, occasion, compliment count, and compliment note.
- Wears tab between Collection and Today.
- Today tab between Wears and Insights for the active current-day wear, compliment stepper, journal note, and same-day wear stack.
- Wears Month view with day dots and selected-day detail sheet.
- Wears day cells show a count badge when multiple wears land on the same date.
- Wears selected-day wear entry: press plus, choose a bottle, save a wear for that date.
- Wears selected-day wear editing and confirmed deletion from the day sheet.
- Wears By bottle view with last-worn labels and sparkline markers.
- Collection rows and fragrance detail now surface last-worn summaries outside the wear-history list.
- Optional bottle metadata on shelf rows: status, size, purchase date, purchase source, purchase price, and currency.
- Optional ideal wear profile on shelf rows: preferred seasons and preferred time of day.
- Insights tab derives most worn, neglected bottles, compliment leaders, seasonal favorites, day/night distribution, and taste profile from client query data.
- Active wear support uses `wears.is_active` plus `set_active_wear(wear_id)` so one wear per user/day can be current.
- Curated local accord descriptor vocabulary and autocomplete, still stored in `fragrances.accords`.
- Local Kaggle catalog import, retained as a lightweight image/source dataset.
- Shared Supabase `catalog_fragrances` lookup and Add-screen prefill, still saved as user-owned `fragrances` rows with optional catalog metadata.
- Velvet Note handoff checked in under `docs/design-handoff/velvet-note/`.

Key commits:

- `6adf961` - wear logging foundation.
- `6a38a9a` - mockup-driven calendar view.
- `0fca8be` - accord autocomplete and selected-date Wears entry.
- `ca4222e` - Kaggle catalog import pipeline and normalized local catalog.
- `deb5846` - Add-screen catalog lookup and prefill.
- `23e9433` - Parfumo shared catalog import path.
- `785737c` - persisted catalog metadata on shelf entries.
- `ba9ba7c` - Add search moved to Supabase RPC.
- `5c820df` - catalog search ranking and scrollable results.
- Current Phase 2 state - richer catalog metadata, delete/back fixes, editable photo URLs, scraper-ready catalog image infrastructure, self-attached personal photo uploads, barcode mapping, a dedicated scanner route, pending links for unknown barcodes, admin-gated review RPCs, an admin-visible barcode review entry, barcode import tooling, last-worn summaries, personal journal metadata, richer wear logging, and Insights.
- `eb1e752` - admin-only Collection entry for barcode review.
- `49a5864` - CSV barcode linkage import tooling.
- `b1c091c` - repeatable barcode live smoke-test checklist.

Live Supabase project:

- Project ref: `aekzcttzqfwlxbsueqrf` (`velvet-note`).
- `wears` migration is applied.
- `catalog_fragrances` is seeded with the Parfumo TidyTuesday snapshot.
- `search_catalog_fragrances(search_text, match_limit)` is live for Add-screen catalog search.
- `catalog_fragrances.image_url`, `image_scraped_at`, and `image_scrape_status` are available for scraper-backed image enrichment and returned by catalog search.
- Storage bucket `fragrance-images` is live, public-read, and configured for JPEG/PNG/WebP up to 10 MB.
- `list_fragrances_with_catalog_images()` is live for app shelf reads; user-owned `fragrances.image_url` takes priority, then linked catalog image fallback.
- Scraper handoff contract: `docs/catalog-image-scraper-contract.md`.
- `user-fragrance-photos` is live for user-attached bottle photos.
- `catalog_barcodes` and `find_catalog_fragrance_by_barcode(barcode_text)` are live for exact barcode lookup.
- `catalog_barcode_submissions` stages authenticated user barcode links for review when scans do not have an exact match.
- `app_admins`, `list_pending_catalog_barcode_submissions`, `approve_catalog_barcode_submission`, and `reject_catalog_barcode_submission` define the trusted review path for pending barcode links.
- `/barcode-review` lists, approves, and rejects pending barcode links; admins can reach it from the Collection header after `is_app_admin()` succeeds.
- `npm run import:barcodes -- path/to/barcode-linkages.csv` imports external barcode mapping data into `catalog_barcodes` with service-role credentials.
- Barcode live smoke checklist: `docs/barcode-live-smoke-test.md`.
- Local migration `supabase/migrations/20260425020000_personal_journal_fields.sql` adds the personal journal fields and updates `list_fragrances_with_catalog_images()` to return them. Apply it before live-testing Bottle, Wear Profile, richer wear context, or Insights with Supabase data.
- Local migration `supabase/migrations/20260425030000_today_active_wear.sql` adds `wears.is_active` and `set_active_wear(wear_id)` for the Today tab. Apply it after the personal journal metadata migration.

## Verification

Static checks for the latest Wears, accord, catalog, and personal journal follow-ups:

```powershell
npm.cmd test -- --runInBand
npm.cmd run lint
.\node_modules\.bin\tsc.cmd --noEmit
```

Browser workflow was verified with Playwright against Expo web on `http://localhost:8091` because `agent-browser` was not available on PATH:

1. Sign up with a temporary test user.
2. Add a test bottle.
3. Log today's wear from fragrance detail.
4. Open `/calendar` (the Wears route).
5. Confirm Month mode renders the selected-day sheet.
6. Switch to By bottle and confirm the logged bottle appears.

Temporary test users were removed from Supabase after verification.

## Intentional Gaps

- Barcode scan/review still needs a recorded end-to-end live Supabase smoke pass: unknown scan submission -> review approval -> repeat scan resolves as a catalog match. The checklist is documented in `docs/barcode-live-smoke-test.md`.
- Personal journal metadata migration still needs a live Supabase apply/smoke pass.
- No dedicated E2E test suite yet; Playwright was used as an ad hoc smoke check.
- Barcode mapping data still depends on external source/import feeds; the repo now has importer plumbing but not a populated barcode dataset.

## Next Good Slice

Apply the personal journal metadata and active-wear migrations, then smoke Bottle/Wear Profile/Wears/Today/Insights against live Supabase data. After that, run the live barcode scan/review smoke loop. The next good product slice is either a dedicated E2E smoke suite, barcode data population from a vetted source, or LLM fallback for unknown catalog entries.
