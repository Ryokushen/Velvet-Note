# Changelog

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
