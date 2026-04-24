# Velvet Note

Personal fragrance collection tracker. Mobile-first (Expo + React Native), Supabase backend.

Some internal package/file names still use `fragrance-app`; the product name in the UI is *Velvet Note*.

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in your Supabase URL and anon key.
3. Apply database migrations in `supabase/migrations/` via the Supabase SQL editor.
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

## Test

```bash
npm test
```

## Current scope

Shipped:
- Auth: email/password
- Collection list with search
- Add fragrance: local catalog lookup/prefill, brand, name, concentration, curated/free-text accords, rating
- Detail view with edit + delete
- Wear logging from fragrance detail and selected Calendar days
- Calendar tab with month grid, same-day wear counts, selected-day detail/edit/delete, and by-bottle view
- Online-only (offline is Phase 3)

Deferred to Phase 4:
- Apple Sign In
- Google Sign In

Milestones:
- `phase-1` tag: Phase 1 email/password collection MVP
- `main`: Phase 1.5 wear calendar plus local catalog lookup/prefill

See `docs/design-spec.md`, `docs/phase-1-plan.md`, `docs/phase-1.5-status.md`, and `docs/parfumo-catalog-import.md` for the full spec, roadmap, and catalog import notes.
