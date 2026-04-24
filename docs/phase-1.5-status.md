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

Phase 1.5 wear logging and the Calendar UI are shipped on `main`. Calendar day-sheet logging for arbitrary selected dates and curated accord autocomplete were added after the initial Phase 1.5 shipment. Catalog lookup has moved beyond this phase: the local Kaggle lookup was superseded by the Phase 2 shared Supabase catalog search path.

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

Live Supabase project:

- Project ref: `aekzcttzqfwlxbsueqrf` (`velvet-note`).
- `wears` migration is applied.
- `catalog_fragrances` is seeded with the Parfumo TidyTuesday snapshot.
- `search_catalog_fragrances(search_text, match_limit)` is live for Add-screen catalog search.

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

## Next Good Slice

Surface richer shared catalog metadata in the app: top/middle/base notes, year, perfumers, and rating metadata on Add results and fragrance detail.
