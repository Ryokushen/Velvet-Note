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

Phase 1.5 wear logging and the Calendar UI are shipped on `main`. Calendar day-sheet logging for arbitrary selected dates and curated accord autocomplete were added after the initial Phase 1.5 shipment. Catalog lookup has moved beyond this phase: the local Kaggle lookup was superseded by the Phase 2 shared Supabase catalog search path, catalog image infrastructure is ready for scraper backfill, and self-attached personal photo upload is implemented locally.

Shipped:

- `wears` Supabase table with RLS, owner checks, indexes, and `updated_at` trigger.
- Wear data layer: `types/wear.ts`, `lib/wears.ts`, `hooks/useWears.ts`.
- Service tests in `__tests__/wears.test.ts`.
- Fragrance detail "Log today" flow with optional note.
- Calendar tab between Collection and Add.
- Calendar Month view with day dots and selected-day detail sheet.
- Calendar day cells show a count badge when multiple wears land on the same date.
- Calendar selected-day wear entry: press plus, choose a bottle, save a wear for that date.
- Calendar selected-day wear editing and confirmed deletion from the day sheet.
- Calendar By bottle view with last-worn labels and sparkline markers.
- Curated local accord descriptor vocabulary and autocomplete, still stored in `fragrances.accords`.
- Local Kaggle catalog import, retained as a lightweight image/source dataset.
- Shared Supabase `catalog_fragrances` lookup and Add-screen prefill, still saved as user-owned `fragrances` rows with optional catalog metadata.
- Velvet Note handoff checked in under `docs/design-handoff/velvet-note/`.

Key commits:

- `6adf961` - wear logging foundation.
- `6a38a9a` - mockup-driven calendar view.
- `0fca8be` - accord autocomplete and selected-date Calendar wear entry.
- `ca4222e` - Kaggle catalog import pipeline and normalized local catalog.
- `deb5846` - Add-screen catalog lookup and prefill.
- `23e9433` - Parfumo shared catalog import path.
- `785737c` - persisted catalog metadata on shelf entries.
- `ba9ba7c` - Add search moved to Supabase RPC.
- `5c820df` - catalog search ranking and scrollable results.
- Current working slice - richer catalog metadata, delete/back fixes, editable photo URLs, scraper-ready catalog image infrastructure, self-attached personal photo uploads, barcode mapping, a dedicated scanner route, pending links for unknown barcodes, admin-gated review RPCs, and a compact hidden barcode review UI.

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
- `/barcode-review` is the hidden admin review route for listing, approving, and rejecting pending barcode links.

## Verification

Static checks for the latest Calendar, accord, and catalog follow-ups:

```powershell
npm.cmd test -- --runInBand
npm.cmd run lint
.\node_modules\.bin\tsc.cmd --noEmit
```

Browser workflow was verified with Playwright against Expo web on `http://localhost:8091` because `agent-browser` was not available on PATH:

1. Sign up with a temporary test user.
2. Add a test bottle.
3. Log today's wear from fragrance detail.
4. Open `/calendar`.
5. Confirm Month mode renders the selected-day sheet.
6. Switch to By bottle and confirm the logged bottle appears.

Temporary test users were removed from Supabase after verification.

## Intentional Gaps

- Detail/list do not yet surface "last worn" summary outside the detail wear history section.
- No dedicated E2E test suite yet; Playwright was used as an ad hoc smoke check.
- Barcode review has a hidden route but no normal Settings/Admin navigation entry yet.

## Next Good Slice

Apply the pending barcode migrations to live Supabase, seed the first `app_admins` row, then smoke-test scanner submission and `/barcode-review` against the cloud project.
