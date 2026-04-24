# Changelog

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
