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

Phase 1.5 wear logging and the Wears UI are shipped on `main`. The route is still `app/(tabs)/calendar.tsx` to avoid route churn, but the product label is now Wears. Day-sheet logging for arbitrary selected dates and curated accord autocomplete were added after the initial Phase 1.5 shipment. Catalog lookup has moved beyond this phase: the local Kaggle lookup was superseded by the Phase 2 shared Supabase catalog search path, catalog image infrastructure is ready for scraper backfill, and self-attached personal photo upload is implemented locally. The personal journal roadmap slice is implemented and live-migrated, extending this phase with richer wear context, a new Today tab for the active current-day wear, plus a new Insights tab.

The 2026-07-06 wear-intelligence slice (`c3c52ea`) builds on all of that with client-only features — no new migrations: a scored Today's-pick suggestion, bottle economics (cost per wear, estimated remaining ml), Collection Shelf/Wants/Past segments with wishlist conversion, a persisted list/grid toggle, exposed sort plus In season/Neglected filters, long-press quick logging with haptics, a year wear heatmap on Wears, expanded Insights (streaks, seasonal signatures, crowd-pleasers, economics), a `/wrapped` Year in Review screen, and AsyncStorage-persisted query cache. On 2026-07-10, the measurement-heavy Collection-to-Detail shared-element overlay was retired in favor of an opaque native-stack dissolve-and-lift transition so route composition, open, close, and back gestures stay on one native animation path.

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
- Today's-pick suggestion card with deterministic scoring, reasons, shuffle, and one-tap wear (`lib/suggestion.ts`, `components/SuggestionCard.tsx`).
- Weather-aware suggestion refinement: accord-to-climate affinity table (`lib/accordClimate.ts`), keyless Open-Meteo weather client with 1h cache (`lib/weather.ts`), a home-city setting on the Today tab, and temperature/rain/humidity scoring capped below explicit season preferences.
- Bottle economics: cost per wear and estimated remaining ml on Detail, shelf value and best value on Insights (`lib/bottleEconomics.ts`).
- Collection Shelf/Wants/Past segments, persisted list/grid view toggle, Top rated/Recent sort chips, In season/Neglected filters, and long-press quick logging with haptic feedback.
- Wishlist-to-owned conversion action on wishlist Detail pages.
- Year wear heatmap segment on Wears with per-year navigation (`components/WearHeatmap.tsx`, `lib/wearAnalytics.ts`).
- Insights: current/longest streaks, seasonal signatures, crowd-pleasers by compliments per wear, and shelf economics sections, plus a Year in Review entry card.
- `/wrapped` Year in Review screen with per-year browsing.
- TanStack Query cache persisted to AsyncStorage (7-day window) for instant cold-start shelf renders.
- Native-stack dissolve-and-lift transition between Collection and Detail, shared by list/grid selection and native back navigation.

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
- `2d326c3` / `820e09d` - green quality baseline (dependency realignment, jest-expo fixes).
- `c3c52ea` - wear-intelligence slice and root-overlay morph transition.
- Current - custom morph retired; Collection-to-Detail navigation rebuilt on the native stack.

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
- `supabase/migrations/20260425020000_personal_journal_fields.sql` is applied live; it adds personal journal fields and updates `list_fragrances_with_catalog_images()` to return them.
- `supabase/migrations/20260425030000_today_active_wear.sql` is applied live; it adds `wears.is_active`, `set_active_wear(wear_id)`, and the one-active-wear-per-user/day index for the Today tab.
- EAS project `@ryokushen/fragrance-app` is linked for native builds. Android preview uses application id `com.charlesdorfeuille.velvetnote` and the `preview` APK profile in `eas.json`.

## Verification

Static checks for the 2026-07-06 wear-intelligence slice (Linux, Darter Pro):

```bash
npx tsc --noEmit
npm run lint
npx jest --ci        # 39 suites, 216 tests
EXPO_PUBLIC_SUPABASE_URL=... EXPO_PUBLIC_SUPABASE_ANON_KEY=... npx expo export --platform web
```

Historical Windows commands from the original Phase 1.5 verification:

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
- The live `catalog_barcodes` table currently has no seeded barcode rows, so the known-barcode path cannot be meaningfully tested until a small trusted starter set is created from physical bottles/boxes or an approved linkage source.
- Android preview APK was rebuilt 2026-07-06 with the wear-intelligence slice (EAS build `22ccdcd7`, staged at `builds/velvet-note-preview-2026-07-06.apk`, gitignored) but still needs an on-device smoke pass — including the morph transition feel, suggestion scoring sanity, and haptic weights.
- No dedicated E2E test suite yet; Playwright was used as an ad hoc smoke check.
- Barcode mapping data still depends on external source/import feeds; the repo now has importer plumbing but not a populated barcode dataset.
- Weather-aware suggestions use a manually set home city (Open-Meteo geocoding + forecast, no API key, no native module). Automatic GPS location needs `expo-location` (native rebuild) and remains deferred.

## Next Good Slice

Build and install a fresh preview APK, then smoke the full current surface against live Supabase: auth, Add, Collection segments/grid/quick-log, native Collection-to-Detail transition and back gesture, Wears month + year heatmap, Today suggestion card, Insights, Year in Review, catalog search, and barcode permission. Tune product constants if needed (`SUGGESTION_WEIGHTS` in `lib/suggestion.ts`, `ML_PER_WEAR` in `lib/bottleEconomics.ts`). Defer the live barcode resolution loop until physical bottles/boxes or a vetted barcode linkage source are available; then seed a tiny starter set and run `docs/barcode-live-smoke-test.md`. The next good product slices after device smoke: a dedicated E2E smoke suite, LLM fallback for unknown catalog entries, or GPS-based weather location via `expo-location` (the manual-city weather path is already shipped).
