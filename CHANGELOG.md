# Changelog

## 2026-07-10 - Rebuild Collection-to-Detail navigation on the native stack

### Summary

The custom shared-element morph was removed after repeated device work showed that its smoothness depended on JS measurement, detail-screen mount timing, and a transparent route transition landing on the same frame. Collection selection now uses one native-stack dissolve-and-lift transition, giving list and grid entries the same immediate, consistently composited handoff and a native reverse on back.

### Shipped

- The fragrance route is an opaque native-stack card using `fade_from_bottom`, with the platform transition handling both open and close.
- Collection entries push directly after light haptic feedback; they no longer wait for `measureInWindow` before navigating.
- Detail content renders immediately and back navigation delegates directly to the stack, restoring the native back gesture instead of intercepting route removal.
- Removed the root overlay host, duplicated morph renderer, global morph state machine, target-measurement wait, coordinate conversion, and settle crossfade.
- Replaced the measurement-heavy transition suite with focused coverage for immediate list/grid navigation, native back delegation, and the no-history fallback.

### Verification

- `npx tsc --noEmit`
- `npm run lint`
- `npx jest --ci --runInBand` (42 suites, 230 tests)

## 2026-07-09 - Anchor morph coordinates to the overlay host

### Summary

Frame-by-frame analysis of a device screen recording showed every measured morph rect rendering one status-bar height too high: on Android edge-to-edge, `measureInWindow` reports positions offset from where the root overlay actually draws. All morph measurements are now converted into the overlay host's own coordinate space, so the card finally grows out of the exact cell you tap and settles without the drop. The grid-view crossfade copy also now mirrors the grid cell layout instead of the list row's. Transition polish is still in progress.

### Shipped

- `lib/morphTransition.ts`: the overlay host registers its own measured window origin (`setMorphHostWindowOrigin`) and `toMorphLocalRect` converts every `measureInWindow` result into overlay-local coordinates — cancelling any constant offset (status bar under edge-to-edge) by construction, a no-op on devices without one.
- `MorphOverlayHost` is now an always-mounted, transparent measuring view that anchors that coordinate space.
- Collection row/cell origin measurement and the detail screen's card/heading/hero target measurements all pass through the conversion.
- Morph origins carry an `originKind` (`row`/`grid`) and the overlay's crossfade copy mirrors the grid cell layout (art above caption, grid heading scale) when opening from grid view.

### Verification

- `npx tsc --noEmit && npm run lint && npx jest --ci` (42 suites, 241 tests)
- On-device screen recording decoded at true source frames (screenrecord is VFR — constant-fps resampling had masked the earlier offset): grid open now inflates from the tapped cell and closes back into it with no settle jump in either direction

## 2026-07-08 - Measure real morph destinations

### Summary

The Collection-to-Detail morph now animates to where the detail screen actually is instead of hardcoded coordinates that ignored the safe-area inset, removing the ~50px jump and doubled text that made the transition read as choppy on device.

### Shipped

- `lib/morphTransition.ts`: the store carries `MorphTargets` (card/heading/hero rects in window coordinates) reported via `setMorphTargets`.
- Detail screen measures its container, heading block, and hero image after layout and reports them as morph targets; it re-measures right before the closing morph starts so the overlay's first closing frame matches what is on screen (including scroll position).
- `CollectionDetailMorph` derives all destination geometry from the measured targets; the pre-measurement fallback now at least accounts for `insets.top`, which the old constants dropped.
- `MorphOverlayHost` holds the opening morph on its frozen first frame (card exactly over the tapped row) until targets arrive — the RN equivalent of `postponeEnterTransition` — with a 250 ms fallback so it can never hang.

### Verification

- `npx tsc --noEmit && npm run lint && npx jest --ci` (42 suites, 237 tests; 3 new morph-target cases)
- On-device recheck of the open/close morph via the rebuilt preview APK

## 2026-07-07 - Velvet Note app icon

### Summary

The app finally looks like itself on the launcher: the default Expo template icons are replaced with "The Note" — an oxblood perfume drop resting as a note head on bone staff hairlines, drawn from the design-brief palette — with two alternate branded concepts kept in-repo for one-command swapping.

### Shipped

- New app icon set in `assets/images/`: iOS/general icon, Android adaptive foreground/background/monochrome (themed-icon ready), splash icon, and favicon, all rendered at 1024 px from SVG sources.
- Three complete branded concepts under `assets/icon-concepts/` (`note`, `flacon`, `monogram`), each with PNG assets plus editable SVG sources; swap with `Copy-Item assets\icon-concepts\<name>\*.png assets\images\ -Force`.
- `app.json`: Android adaptive-icon background moved from template blue `#E6F4FE` to brand dark `#0F0E0D`, and the splash screen now uses the brand-dark background in both light and dark modes so the bone glyph stays visible.

### Verification

- Rendered PNGs visually inspected at full size, adaptive-mask crop, and small sizes; `app.json` parse-checked.

## 2026-07-06 - Weather-aware wear suggestions

### Summary

Today's pick now reads the sky: a static accord-to-climate affinity table scores each bottle's scent profile against live conditions for a manually set home city, refining the suggestion ranking without ever outranking explicit season preferences.

### Shipped

- `lib/accordClimate.ts`: accord-to-climate affinity table (heat/cold/rain axes) with per-accord overrides and family fallback via the existing accord vocabulary.
- `lib/weather.ts`: keyless Open-Meteo client — city geocoding search, current conditions, 1-hour AsyncStorage cache, saved home city.
- Weather scoring rule in `lib/suggestion.ts`: hot/warm days boost fresh profiles and penalize heavy ones (max ±15), cold reverses, rain nudges earthy/woody (max ±6), warm humidity penalizes heavy projectors (−6); reasons like "Made for this heat" and "Right for the rain". Absent weather is a strict no-op.
- Home-city row on the Today tab under the suggestion card: search, pick, and change the city inline; shows city and current temperature once set.
- Weather failures (offline, API down, no city) silently fall back to the existing season/time-based ranking.

### Verification

- `npx jest --ci __tests__/accordClimate.test.ts __tests__/suggestionWeather.test.ts __tests__/weather.test.ts __tests__/suggestion.test.ts __tests__/TodayTab.test.tsx`
- `npx tsc --noEmit && npm run lint && npx jest --ci`

## 2026-07-06 - Wear intelligence, wishlist, grid view, and Year in Review

### Summary

Major feature slice that puts the journal data to work: a scored daily wear suggestion, bottle economics, a real wishlist, one-tap logging, a year heatmap, expanded insights, a Year in Review screen, cached cold starts, and haptics throughout.

### Shipped

- Today tab now opens with a scored "Today's pick" suggestion (season, time of day, rest period, rating, compliments-per-wear) with reasons, shuffle, and one-tap wear (`lib/suggestion.ts`).
- Bottle economics: cost per wear and estimated remaining ml on the Detail Bottle section, plus shelf value and best-value rankings on Insights (`lib/bottleEconomics.ts`).
- Collection tab rebuilt: Shelf/Wants/Past segments (wishlist and sold/gifted bottles get their own views), list/grid view toggle (persisted), exposed Top rated/Recent sort, In season and Neglected filter chips, and long-press quick logging with a "Logged today" confirmation.
- Wishlist conversion: a "Got it — mark as owned" action on wishlist detail pages.
- Wears tab gained a Year segment with a GitHub-style wear heatmap and per-year navigation (`components/WearHeatmap.tsx`, `lib/wearAnalytics.ts`).
- Insights expanded with current/longest wear streaks, seasonal signatures, crowd-pleasers ranked by compliments per wear, and shelf economics.
- New Year in Review screen (`/wrapped`, linked from Insights): total wears, bottles worn, ml sprayed, compliments, fragrance of the year, compliment champion, season/month leaders, longest streak, best value, and bottles added — with per-year browsing.
- TanStack Query cache now persists to AsyncStorage (7-day window) so the shelf renders instantly on cold start.
- Haptic feedback on wear logging, segment/filter/sort changes, and view toggles (`lib/haptics.ts`).

### Verification

- `npx tsc --noEmit && npm run lint && npx jest --ci` (39 suites, 216 tests)
- `EXPO_PUBLIC_SUPABASE_URL=... npx expo export --platform web`

## 2026-07-06 - Rebuild the collection/detail morph as a root overlay

### Summary

Restructured the shared-element transition so navigation happens immediately and the morph card plays over both screens, removing the flash, the double animation, and the blank slide-in that made opening and closing a fragrance feel rough.

### Shipped

- Turned `lib/morphTransition` into a small phase store (`idle → opening → open → closing`) that coordinates the Collection tab, the detail screen, and a new root-level `MorphOverlayHost`.
- Detail route now pushes instantly as a transparent modal (fade for non-collection entries); the heavy detail mount hides behind the opaque morph card and reveals when the morph settles.
- Closing pops the route on the next frame so the card shrinks into the real collection row instead of an empty background, then cross-fades out.
- Backing out mid-open reverses the card along the same path instead of jumping to fullscreen.
- Rewrote the overlay to animate transforms only (translate + scale with counter-scaled content) — no per-frame layout passes, and the card shadow rasterizes once.
- Hidden detail content no longer receives touches while the morph plays.
- Removed the now-unused `transitioning` row prop and the delayed detail content fade.

### Verification

- `npx tsc --noEmit && npm run lint && npx jest --ci`
- `npx expo export --platform web` (static-renders all routes including the new overlay host)

## 2026-05-11 - Restore green quality baseline

### Summary

Realigned dependencies and test tooling so typecheck, lint, and the full Jest suite run green again, and silenced the remaining quality noise.

### Shipped

- Realigned `package.json`/`package-lock.json` dependencies to a consistent Expo SDK 54 baseline.
- Fixed jest-expo/Jest setup compatibility in `jest.setup.js` and removed the deprecated `@testing-library/jest-native` dependency.
- Added npm `overrides` for `@tootallnate/once` and `postcss`.
- Fixed lint/type noise in Wears, Today, and Detail (consolidated type imports, hook dependency arrays, string literals).
- Simplified the admin-gate error handling on the Collection tab.
- Registered the `expo-web-browser` plugin in `app.json` and refreshed barcode smoke-test and phase-status docs.

### Verification

- `npx tsc --noEmit && npm run lint && npx jest --ci`

## 2026-05-11 - Fix collection morph row measurement

### Summary

Fixed the Collection row measurement used by the shared-element morph so the transition originates from the correct row geometry.

### Shipped

- Corrected row measurement handling on the Collection tab.
- Extended the Collection detail transition test to cover the measurement path.

### Verification

- `npx jest --ci __tests__/CollectionDetailTransition.test.tsx`

## 2026-04-26 - Polish collection transition and tab labels

### Summary

Brought the Collection-to-Detail shared-element transition in line with the design spec and kept the five tab labels from wrapping.

### Shipped

- Matched the Collection detail morph timing/geometry to the shared-element transition spec across the Collection tab, Detail screen, `CollectionDetailMorph`, and `lib/morphTransition`.
- Constrained tab bar labels to a single line in the tab layout.

### Verification

- `npx jest --ci __tests__/CollectionDetailTransition.test.tsx`

## 2026-04-25 - Prepare Android preview build

### Summary

Configured the project for an installable Android preview APK via EAS Build.

### Shipped

- Added `eas.json` with a preview APK build profile and linked the EAS project ID.
- Set the app display name to "Velvet Note" and the Android package to `com.charlesdorfeuille.velvetnote`.
- Declared the Android camera permission and `expo-camera` plugin config for barcode scanning.
- Hardened the Today tab journal-save error handling and covered it in `TodayTab` tests.
- Updated README, design spec, smoke tests, and status docs for the Android build path.

### Verification

- `npx jest --ci __tests__/TodayTab.test.tsx`

## 2026-04-25 - Add Today wear tab

### Summary

Added a focused Today tab for the active current-day wear, so compliments and journal notes can be updated quickly throughout the day.

### Shipped

- Added `wears.is_active` and `set_active_wear(wear_id)` for one active wear per user/day.
- Added active-wear helpers and tests for same-day stack selection.
- Marked newly logged wears for today as current while preserving historical wear behavior.
- Added the Today tab between Wears and Insights.
- Added active fragrance photo/name, compliment `- / +` controls, journal save, and same-day wear stack switching.
- Serialized compliment writes so rapid taps and active-wear switches do not regress the persisted count.
- Updated docs and smoke tests for the five-tab journal shell.

### Verification

- `/opt/homebrew/bin/node ./node_modules/.bin/jest --runInBand __tests__/todayWear.test.ts __tests__/TodayTab.test.tsx`

## 2026-04-25 - Document personal journal roadmap slice

### Summary

Audited project docs after implementing the personal journal foundation and updated the roadmap/status language to match the current four-tab product direction.

### Shipped

- Updated README current scope for Collection, Wears, Insights, Add.
- Documented optional bottle metadata, preferred wear profile, richer wear context, compliments, and client-derived Insights.
- Marked the personal journal Supabase migration as the next live apply/smoke item.
- Expanded manual smoke tests for Bottle, Wear Profile, Wears, and Insights.

### Verification

- `rg -n "Calendar|Wears|Insights|bottle|compliment|season|migration" README.md docs CHANGELOG.md`

## 2026-04-25 - Audit Phase 2 barcode docs

### Summary

Updated project documentation to match the current barcode/admin/import state after the latest Phase 2 slices.

### Shipped

- Marked barcode scanning, pending-link review, admin review navigation, and barcode import tooling as shipped.
- Added `docs/catalog-barcode-import.md` for CSV barcode linkage imports.
- Updated status/index docs to point at the barcode live smoke checklist.
- Replaced stale hidden-route language with the admin-only Collection entry.

### Verification

- `rg -n "hidden admin|hidden review|barcode|LLM|outstanding|Phase 2|smoke|review route|import" docs README.md CHANGELOG.md`

## 2026-04-25 - Surface last-worn summaries

### Summary

Added concise last-worn context outside the wear-history list so recently used bottles are easier to scan.

### Shipped

- Added collection-row last-worn labels derived from wear history.
- Added a top-level Detail last-worn panel above the rating and notes sections.
- Added shared last-worn date helpers.
- Added tests for collection and detail last-worn display.

### Verification

- `npm test -- __tests__/LastWornSummary.test.tsx --runInBand --watchman=false`

## 2026-04-25 - Add barcode review UI

### Summary

Added a compact hidden admin route for reviewing pending barcode submissions from the scanner flow.

### Shipped

- Added `/barcode-review` as a non-tab admin surface.
- Lists pending barcode submissions through the review helper.
- Shows barcode, source, proposed catalog brand/name, and an optional review note.
- Approve promotes the submission through the admin RPC; reject closes it through the reject RPC.
- Added screen coverage for loading, approve, reject, and authorization errors.

### Verification

- `npm test -- __tests__/BarcodeReview.test.tsx --runInBand --watchman=false`

## 2026-04-25 - Add barcode submission review RPCs

### Summary

Added the backend review path for unknown barcode submissions so trusted admins can promote pending links into shared scanner matches or reject incorrect submissions.

### Shipped

- Added `app_admins` as the allowlist for review-only RPC access.
- Added `list_pending_catalog_barcode_submissions(match_limit)` for admin review queues.
- Added `approve_catalog_barcode_submission(submission_id, review_note)` to promote a pending submission into `catalog_barcodes`.
- Added `reject_catalog_barcode_submission(submission_id, review_note)` to close bad pending links.
- Added typed catalog helpers for listing, approving, and rejecting barcode submissions.

### Verification

- `npm test -- __tests__/catalog.test.ts --runInBand --watchman=false`

## 2026-04-25 - Add unknown barcode linking queue

### Summary

Added the next scanner slice so an unknown barcode can be linked to a catalog row as a pending user submission instead of dead-ending at the no-match state.

### Shipped

- Added `catalog_barcode_submissions` for authenticated, user-owned pending barcode links.
- Added `submitCatalogBarcodeSubmission()` to normalize and submit scanned barcode mappings.
- Expanded the `/scan` no-match state with inline catalog search, catalog-row selection, and pending-link submission.
- Added tests for normalized barcode submission and the unknown-barcode linking flow.

### Verification

- `npm test -- __tests__/catalog.test.ts __tests__/ScanBarcode.test.tsx --runInBand --watchman=false`

## 2026-04-25 - Add dedicated barcode scanner screen

### Summary

Added a separate camera-first scanner route so Add stays focused on form entry while barcode capture and lookup happen in their own flow.

### Shipped

- Added `expo-camera`.
- Added `/scan` with camera permission handling, barcode scan feedback, match/no-match states, and retry controls.
- Added a compact `Scan barcode` entry point to Add.
- Wired matched scans back to Add through the scanned barcode so Add can prefill from `find_catalog_fragrance_by_barcode`.
- Added tests for Add scanner routing, barcode prefill, scanner match handoff, and no-match handling.

### Verification

- `npm test -- __tests__/AddBarcodeScan.test.tsx __tests__/ScanBarcode.test.tsx --runInBand --watchman=false`
- `npm test -- --runInBand --watchman=false`
- `npm run lint`
- `./node_modules/.bin/tsc --noEmit`

## 2026-04-24 - Add barcode catalog contract

### Summary

Added the first barcode foundation: a shared barcode mapping table that links UPC/EAN/GTIN values to catalog fragrance rows, plus an app helper for exact barcode lookup.

### Shipped

- Added `catalog_barcodes` with barcode, type, catalog row, product label, size text, source, confidence, and verification fields.
- Added public-read RLS for barcode mappings so clients can resolve scans without exposing write access.
- Added `find_catalog_fragrance_by_barcode(barcode_text)` for exact normalized lookup.
- Added `normalizeBarcode()` and `findSupabaseCatalogByBarcode()` in the catalog helper.
- Added unit coverage for scanner payload normalization and barcode RPC lookup.

### Verification

- `npm test -- __tests__/catalog.test.ts --runInBand --watchman=false`

## 2026-04-24 - Fix Calendar wear delete confirmation

### Summary

Replaced the Calendar wear delete native alert with an in-app confirmation so deleting wear entries is actionable on Expo web.

### Shipped

- Added a selected-row delete confirmation panel in the Calendar day sheet.
- Kept the destructive delete action behind a second explicit button.
- Added regression coverage for the in-app confirmation and delete mutation.

### Verification

- `npm test -- __tests__/calendarWearEntry.test.tsx --runInBand --watchman=false`
- `npm test -- --runInBand --watchman=false`
- `npm run lint`
- `./node_modules/.bin/tsc --noEmit`
- Browser check on `http://localhost:8082/calendar`

## 2026-04-24 - Add self-attached bottle photo uploads

### Summary

Added personal bottle photo attachment on Add and Detail so user-owned shelf rows can store their own image URL instead of only pasted links or catalog fallback imagery.

### Shipped

- Added `expo-image-picker` and a shared photo helper for picking media-library images.
- Added upload support to the `user-fragrance-photos` Supabase Storage bucket path `<user_id>/<fragrance_namespace>-<timestamp>.<ext>`.
- Added an Attach photo action on the Add form and Detail edit screen.
- Kept catalog images fallback-only by clearing the user photo field when a catalog row is selected.
- Added a Storage migration for the `user-fragrance-photos` public-read bucket with authenticated owner write/update/delete policies.

### Verification

- `npm test -- --runInBand --watchman=false`
- `npm run lint`
- `./node_modules/.bin/tsc --noEmit`

## 2026-04-24 - Prepare shared catalog image backfill

### Summary

Added the shared-catalog image URL plumbing so external image enrichment can write into `catalog_fragrances` and flow through Add-screen catalog selection.

### Shipped

- Added nullable `catalog_fragrances.image_url`, scrape timestamp, and scrape status schema support.
- Added the `fragrance-images` public-read Supabase Storage bucket setup for scraper uploads.
- Added a pending-image index for scraper batch selection.
- Updated `search_catalog_fragrances` to return catalog image URLs.
- Mapped RPC `image_url` into app-facing catalog results instead of dropping it.
- Added `list_fragrances_with_catalog_images()` so existing shelf rows can fall back to scraper-filled catalog imagery.
- Documented the scraper write/read contract in `docs/catalog-image-scraper-contract.md`.

### Verification

- `npm test -- --runInBand --watchman=false`
- `npm run lint`
- `./node_modules/.bin/tsc --noEmit`

## 2026-04-24 - Add editable bottle photo URLs

### Summary

Added the first photo-management slice using the existing `image_url` field, so bottle art can be attached without adding a new picker dependency yet.

### Shipped

- Added a `Photo URL` field to the Add form for manually entered bottle imagery.
- Added a `Photo URL` field to the Detail edit form with a live bottle-art preview.
- Saved trimmed image URLs and stored empty photo fields as `null`.
- Kept catalog-selected imagery editable by preloading the catalog image URL into the Add form.

### Verification

- `npm test -- --runInBand --watchman=false`
- `npm run lint`
- `./node_modules/.bin/tsc --noEmit`

## 2026-04-24 - Surface richer catalog metadata

### Summary

Added the next Phase 2 catalog slice so selected shared catalog rows carry richer metadata into user shelf entries without surfacing community ratings beside personal ratings.

### Shipped

- Extended `search_catalog_fragrances` to return release year, perfumers, and top/heart/base notes.
- Added shelf-row columns for persisted catalog release year, note pyramid, and perfumers.
- Added compact release/perfumer context to Add-screen catalog results.
- Added a Catalog profile section on fragrance detail for saved year, perfumer, and true top/heart/base notes.

### Verification

- `node --max-old-space-size=8192 ./node_modules/.bin/jest --runInBand --watchman=false`
- `npm run lint`
- `./node_modules/.bin/tsc --noEmit`

## 2026-04-24 - Audit docs for Phase 2 catalog state

### Summary

Updated project documentation so the current state reflects the live shared Supabase catalog instead of the earlier local-catalog phase.

### Shipped

- Updated README scope and milestones for the Phase 2 catalog-search foundation.
- Updated hub/index/status notes to mark `catalog_fragrances` and the search RPC as live.
- Revised the design spec data model and roadmap around `catalog_fragrances`, barcode, moderation, and LLM fallback.
- Expanded manual smoke tests for catalog RPC setup, distinct note searches, and scrollable Add results.

### Verification

- Documentation audit with `rg` for stale local-catalog, pending, and historical path language.

## 2026-04-24 - Improve shared catalog search ranking

### Summary

Adjusted catalog search ranking so note searches do not collapse into the same most-popular rows.

### Shipped

- Added a replacement `search_catalog_fragrances` migration that ranks match quality before popularity.
- Exact brand/name matches rank first, followed by exact accord/top/middle/base note matches.
- Exact note position now breaks ties before rating count.
- Raised Add-screen catalog results to 20 and made the result panel independently scrollable.

### Verification

- `npm.cmd test -- --runInBand`
- `npm.cmd run lint`
- `.\node_modules\.bin\tsc.cmd --noEmit`
- Live Supabase RPC smoke: `search_catalog_fragrances('vanilla', 8)` and `search_catalog_fragrances('sandalwood', 8)` returned distinct ranked result sets.

## 2026-04-24 - Add note-aware shared catalog search

### Summary

Moved shared catalog lookup behind a Supabase RPC so Add search can match brand, bottle name, accords, and note arrays.

### Shipped

- Added `search_catalog_fragrances(search_text, match_limit)` migration.
- Updated the Add catalog helper to call the RPC instead of brand/name-only REST filters.
- Restored Add-screen copy to advertise bottle, brand, or note search.

### Verification

- `npm.cmd test -- --runInBand`
- `npm.cmd run lint`
- `.\node_modules\.bin\tsc.cmd --noEmit`
- Live Supabase RPC smoke: `search_catalog_fragrances('vanilla', 3)` returned Parfumo rows with vanilla notes.

## 2026-04-24 - Use Supabase shared catalog search in Add flow

### Summary

Switched Add-screen catalog lookup from the local Kaggle JSON file to the shared Supabase `catalog_fragrances` table.

### Shipped

- Added async Supabase catalog search against `catalog_fragrances`.
- Normalized shared catalog rows into the existing Add-flow catalog result shape.
- Prefilled concentration from shared catalog rows when available.
- Kept local JSON search utility available for tests/fallback data work.

### Verification

- `npm.cmd test -- --runInBand`
- `npm.cmd run lint`
- `.\node_modules\.bin\tsc.cmd --noEmit`

## 2026-04-24 - Persist catalog metadata on shelf entries

### Summary

Saved selected catalog metadata with user-owned shelf rows and surfaced bottle art in the collection and detail views.

### Shipped

- Added optional catalog metadata columns to `fragrances`.
- Saved catalog id, image URL, description, and source when adding from a local catalog match.
- Added shared `BottleArt` rendering with image fallback to the existing bottle placeholder.
- Displayed bottle art in collection rows and fragrance detail.

### Verification

- `npm.cmd test -- --runInBand`
- `npm.cmd run lint`
- `.\node_modules\.bin\tsc.cmd --noEmit`

## 2026-04-24 - Add Parfumo shared catalog import path

### Summary

Added repo-owned Supabase infrastructure for the Phase 2 shared fragrance catalog while keeping large seed artifacts outside git.

### Shipped

- Added `catalog_fragrances` and `catalog_fragrances_staging` schema migration with RLS, read grants, and array indexes.
- Added a Parfumo staging-to-catalog upsert script with duplicate URL protection and a coverage sanity report.
- Documented the external `fragrance-data` seed location and import commands.
- Marked the Kaggle import as the current local lookup source and Parfumo as the Phase 2 shared catalog seed.

### Verification

- `npm.cmd test -- --runInBand`
- `npm.cmd run lint`
- `.\node_modules\.bin\tsc.cmd --noEmit`

## 2026-04-24 - Add Calendar wear counts and delete confirmation

### Summary

Improved Calendar day visibility and made wear deletion safer.

### Shipped

- Added a compact count badge on month cells when a day has multiple wears.
- Added a confirmation dialog before deleting a wear from the selected-day sheet.
- Kept the day-sheet edit/delete tests isolated from vector icon loading.

### Verification

- `npm.cmd test -- --runInBand __tests__/calendarWearEntry.test.tsx`
- `npm.cmd test -- --runInBand`
- `npm.cmd run lint`
- `.\node_modules\.bin\tsc.cmd --noEmit`

## 2026-04-24 - Add Calendar wear edit and delete actions

### Summary

Added Calendar day-sheet controls for correcting or removing logged wears.

### Shipped

- Added edit controls to prefill the selected day's wear form from an existing wear.
- Added delete controls for individual wears in the selected-day sheet.
- Reused the existing `useUpdateWear` and `useDeleteWear` mutations so React Query invalidation stays centralized.

### Verification

- `npm.cmd test -- --runInBand __tests__/calendarWearEntry.test.tsx`
- `npm.cmd test -- --runInBand`
- `npm.cmd run lint`
- `.\node_modules\.bin\tsc.cmd --noEmit`

## 2026-04-24 - Add local catalog lookup and Calendar follow-ups

### Summary

Added local catalog import/search support, improved accord entry, and expanded Calendar logging beyond today's wear.

### Shipped

- Added curated accord vocabulary data and Add/Edit accord autocomplete while keeping `fragrances.accords` as simple text arrays.
- Added Calendar selected-day wear entry so past or future dates can be logged from the day sheet.
- Added Kaggle perfume catalog import tooling plus normalized local catalog data.
- Added Add-screen catalog lookup that prefills brand, name, and accords while saving normal user-owned `fragrances` rows.
- Documented the Kaggle import flow and license/source boundary in `docs/catalog-import-kaggle.md`.

### Verification

- `npm.cmd test -- --runInBand`
- `npm.cmd run lint`
- `.\node_modules\.bin\tsc.cmd --noEmit`

## 2026-04-24 - Implement Phase 1.5 wear calendar from Velvet Note handoff

### Summary

Added the Phase 1.5 wear calendar foundation and replaced the plain wear history tab with the mockup-driven Calendar experience.

### Shipped

- Added `wears` Supabase migration with RLS, ownership checks, indexes, and `updated_at` trigger.
- Added wear types, Supabase service helpers, React Query hooks, and service tests.
- Added "Log today" with optional notes from fragrance detail.
- Added Calendar tab between Collection and Add.
- Implemented Month view with wear dots and selected-day detail sheet.
- Implemented By bottle segmented view with last-worn labels and sparkline markers.
- Checked in the Velvet Note design handoff under `docs/design-handoff/velvet-note/`.

### Verification

- `npm.cmd test -- --runInBand`
- `npm.cmd run lint`
- `.\node_modules\.bin\tsc.cmd --noEmit`
- Browser smoke through Playwright fallback against Expo web: sign up, add bottle, log wear, open Calendar, switch to By bottle.

## 2026-04-23 - Fix Android sign-in navigation handoff after auth success

### Summary

Resolved a regression where email/password sign-in succeeded against Supabase on Android, but the app appeared to do nothing after the loading spinner stopped. The user remained on the sign-in screen even though Supabase returned a valid session and the client emitted `SIGNED_IN`.

### User-visible symptom

- On Android in Expo Go, tapping `Sign in` showed the button loading spinner briefly and then returned the button to idle.
- No error banner or alert appeared.
- No navigation to the authenticated area occurred.
- Supabase server logs showed `POST /auth/v1/token?grant_type=password` returning `200 OK`.
- Local debugger output later confirmed:
  - `SIGNED_IN` fired
  - `signInWithPassword` returned a session
  - the app still did not transition into the collection UI

### Impact

- Email/password auth was functionally blocked for the refreshed Velvet Note UI flow.
- Existing authenticated sessions could still work, but fresh sign-in was effectively unusable.
- The issue presented as an auth problem, but the failure was in client-side navigation state.

### Root cause

The app mixed Expo Router file-system group paths with Expo Router runtime paths.

Broken assumptions in the pre-fix implementation:

- Auth redirects used file-group paths such as `/(auth)` and `/(tabs)`.
- `AuthGate` inferred whether the user was in the auth flow with:
  - `useSegments()`
  - `segments[0] === '(auth)'`
- Success handlers also navigated to `/(tabs)`.

What Expo Router actually reported at runtime:

- Auth screen pathname: `/sign-in`
- Authenticated root pathname: `/`
- Segments were normalized for runtime navigation and did not reliably expose route-group names the way the file tree suggested.

Net effect:

- Supabase auth completed successfully.
- `SIGNED_IN` fired and a valid session existed locally.
- The old redirect checks never matched the real runtime route state.
- Navigation either never triggered or targeted the wrong path.

### Why the bug was initially misleading

Several early hypotheses were reasonable but ultimately secondary:

- `react-native-svg` native linking after the UI refresh
- `SafeAreaView` / `SafeAreaProvider` interaction
- tabs screen crash during mount
- sign-in component remount racing with auth subscription updates

Those were plausible because the regression arrived during a large design refresh and the first broken experience happened immediately after authentication. The decisive evidence came from instrumenting the auth flow and reducing the authenticated destination to a minimal probe screen:

- `SIGNED_IN` was observed locally
- `signInWithPassword` returned a session locally
- a simple authenticated probe screen rendered once navigation targeted `/`

That isolated the bug to navigation path handling rather than auth transport, native module linking, or the collection screen itself.

### Fix implemented

#### 1. Centralized auth state

Converted auth consumption to a shared provider-backed source so the root layout and screens read the same session snapshot instead of creating independent subscriptions.

Primary file:

- `hooks/useAuth.ts`

#### 2. Switched auth gating to runtime pathname checks

Reworked `AuthGate` to use `usePathname()` and compare against actual runtime routes:

- unauthenticated users are redirected to `/sign-in`
- authenticated users entering the auth flow are redirected to `/`

Primary file:

- `app/_layout.tsx`

#### 3. Fixed post-auth success navigation

Changed sign-in success navigation to use `/` instead of `/(tabs)`.

Primary file:

- `app/(auth)/sign-in.tsx`

#### 4. Fixed remaining bad authenticated redirects

Replaced remaining route-group redirects that pointed to `/(tabs)` with runtime path `/`.

Primary files:

- `app/(tabs)/add.tsx`
- `app/fragrance/[id].tsx`

#### 5. Restored the real collection UI after isolation

During diagnosis, the authenticated route was temporarily replaced with a minimal “Tabs mounted.” probe screen to prove whether auth handoff worked independently of the collection screen. After confirming the navigation fix, the real tab layout and collection screen were restored.

Primary files:

- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`

### Files involved in the final fix

- `app/_layout.tsx`
- `app/(auth)/sign-in.tsx`
- `hooks/useAuth.ts`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/add.tsx`
- `app/fragrance/[id].tsx`

### Verification

Verified locally with:

- `npx tsc --noEmit`
- `npm test -- --runInBand --watchman=false`

Observed runtime behavior after fix:

- sign-in succeeds
- `SIGNED_IN` event fires
- app transitions into the authenticated route
- collection UI becomes reachable again

### Operational note

The Expo CLI warning about `jest`, `jest-expo`, and `@types/jest` version drift was unrelated to this bug. It did not cause the sign-in navigation failure.

### Cleanup

Completed before commit:

- removed the temporary auth debugging `console.log` statements from the auth provider, root layout, and sign-in screen after confirming the fix
