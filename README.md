# Velvet Note

Personal fragrance collection tracker. Mobile-first (Expo + React Native), Supabase backend.

Some internal package/file names still use `fragrance-app`; the product name in the UI is *Velvet Note*.

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in your Supabase URL and anon key.
3. Apply database migrations in `supabase/migrations/` via the Supabase SQL editor or `psql`.
4. Start the bundler:
   ```bash
   npx expo start
   ```
5. Scan the QR code with Expo Go.

For web:
```bash
npm run web
```

If the default port is busy:
```bash
npm run web -- --port 8082
```

Apple / Google sign-in are deferred to Phase 4. When they land, they will require a dev build:
```bash
npx expo prebuild
npx expo run:ios   # or run:android
```

## Android preview build

The project is linked to EAS under `@ryokushen/fragrance-app`.

Build an installable Android preview APK:

```bash
npx eas-cli@latest build --platform android --profile preview
```

Required EAS preview environment variables:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

The Android application id is `com.charlesdorfeuille.velvetnote`. The preview profile outputs an APK for direct install on Android devices.

## Test

```bash
npm test
```

## Current scope

Shipped:
- Auth: email/password
- Collection tab with search, Shelf/Wants/Past segments, list/grid view toggle, Top rated/Recent sort, In season/Neglected filters, and long-press one-tap wear logging
- Five-tab personal journal shell: Collection, Wears, Today, Insights, Add
- Add fragrance: Supabase catalog lookup/prefill, brand, name, concentration, curated/free-text accords, personal rating, optional bottle metadata, and ideal wear profile
- Detail view with catalog/personal bottle art, notes, Bottle section (incl. cost per wear and estimated remaining ml), Wear Profile section, wishlist-to-owned conversion, edit, and delete
- Wear logging from fragrance detail and selected Wears days, including optional season, day/night, occasion, compliment count, and compliment note
- Wears tab with month grid, same-day wear counts, selected-day detail/edit/delete, by-bottle view, and a year heatmap
- Today tab for the active current-day wear, compliment stepper, journal note, same-day wear stack, and a scored "Today's pick" suggestion with shuffle, one-tap wear, and weather-aware refinement (manual home city, keyless Open-Meteo)
- Insights tab with client-derived most worn, neglected bottles, crowd-pleasers (compliments per wear), seasonal signatures, wear streaks, shelf economics, seasonal/day-night tendencies, and taste profile
- Year in Review screen (per-year wear story: totals, fragrance of the year, champion, streaks, best value)
- Shared Parfumo catalog in Supabase with brand/name/accord/note search ranking
- Catalog image fallback and self-attached personal bottle photos
- Barcode scanner flow with exact lookup, unknown-link submissions, admin review, and barcode import tooling
- Query cache persistence via AsyncStorage (instant shelf on cold start; full offline is Phase 3)
- Haptic feedback on logging, filters, and key actions

Deferred to Phase 2:
- Live barcode scan/review smoke pass
- Dedicated E2E test suite
- LLM fallback for unknown entries

Deferred to Phase 4:
- Apple Sign In
- Google Sign In

Useful import commands:

```bash
npm run import:kaggle
npm run import:barcodes -- path/to/barcode-linkages.csv
```

Milestones:
- `phase-1` tag: Phase 1 email/password collection MVP
- `main`: Phase 1.5 Wears foundation plus Phase 2 shared catalog, imagery, barcode lookup, barcode review, personal journal foundation, Android preview build setup, and the wear-intelligence slice (suggestions, economics, wishlist, grid, heatmap, Year in Review)

See `docs/design-spec.md`, `docs/phase-1-plan.md`, `docs/phase-1.5-status.md`, `docs/parfumo-catalog-import.md`, `docs/catalog-barcode-import.md`, and `docs/barcode-live-smoke-test.md` for the full spec, roadmap, and catalog/barcode notes.
