# Fragrance App

Personal fragrance collection tracker. Mobile-first (Expo + React Native), Supabase backend.

Working name in code. Leading public-name candidate: *Velvet Note*.

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in your Supabase URL and anon key.
3. Apply the database migration in `supabase/migrations/` via the Supabase SQL editor.
4. Start the bundler:
   ```bash
   npx expo start
   ```
5. Scan the QR code with Expo Go.

Apple / Google sign-in are deferred to Phase 4. When they land, they will require a dev build:
```bash
npx expo prebuild
npx expo run:ios   # or run:android
```

## Test

```bash
npm test
```

## Phase 1 scope

Shipped:
- Auth: email/password
- Collection list with search
- Add fragrance: brand, name, concentration, accords, rating
- Detail view with edit + delete
- Online-only (offline is Phase 3)

Deferred to Phase 4:
- Apple Sign In
- Google Sign In

See `docs/design-spec.md` and `docs/phase-1-plan.md` for the full design spec and phased roadmap.
