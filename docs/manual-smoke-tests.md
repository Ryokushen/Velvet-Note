# Manual Smoke Tests

Run this checklist on a dev build before any demo or release.

## Setup

- [ ] For Android release smoke, install the latest EAS `preview` APK on a physical Android device
- [ ] `.env.local` contains valid Supabase URL + anon key
- [ ] Migrations applied: `fragrances`, `wears`, and `catalog_fragrances` tables exist in Supabase
- [ ] `search_catalog_fragrances(search_text, match_limit)` RPC exists and is granted to anon/authenticated users
- [ ] `catalog_barcodes` table and `find_catalog_fragrance_by_barcode(barcode_text)` RPC exist for exact barcode lookup
- [ ] `catalog_barcode_submissions` table exists and authenticated users can insert their own pending barcode links
- [ ] `app_admins` allowlist and barcode review RPCs exist for promoting/rejecting pending submissions
- [ ] `fragrance-images` Storage bucket exists and is public-read
- [ ] `user-fragrance-photos` Storage bucket exists, is public-read, and authenticated users can write only under their own user-id folder
- [ ] `list_fragrances_with_catalog_images()` RPC exists for shelf image fallback
- [ ] Personal journal migration `20260425020000_personal_journal_fields.sql` is applied
- [ ] Active-wear migration `20260425030000_today_active_wear.sql` is applied
- [ ] `fragrances` has bottle metadata and preferred-use columns
- [ ] `wears` has season, time_of_day, occasion, compliment_count, and compliment_note columns
- [ ] `wears` has `is_active` and `set_active_wear(wear_id)` exists

## Auth

- [ ] Fresh install shows sign-in screen with no stale session
- [ ] Create account with new email/password routes to Collection
- [ ] Sign out returns to sign-in screen
- [ ] Sign in with existing credentials routes to Collection
- [ ] Wrong password shows friendly error, no crash
- [ ] Apple Sign In is deferred to Phase 4
- [ ] Google Sign In is deferred to Phase 4

## Collection List

- [ ] Empty state shown when no fragrances
- [ ] Pull to refresh works
- [ ] Network off renders cached data when available, error state on hard refresh
- [ ] Bottles with wear history show a compact last-worn label in the row
- [ ] Bottles with saved status/size show that metadata lightly in the row

## Add

- [ ] Brand + name required, blocked with alert if missing
- [ ] Scan barcode opens the dedicated scanner screen
- [ ] A matched barcode returns to Add and prefills the catalog result
- [ ] Catalog lookup finds a bottle by name, brand, or note
- [ ] Searching `vanilla` and `sandalwood` returns distinct catalog result sets
- [ ] Catalog result panel scrolls beyond the first five visible rows
- [ ] Selecting a catalog result prefills brand, name, concentration when present, and accords
- [ ] Photo URL preview appears when a valid image link is entered
- [ ] Attach photo opens the media picker, uploads the selected bottle photo, and saves it to the new shelf row
- [ ] Selecting a catalog result with an image does not copy the catalog image into `fragrances.image_url`; catalog imagery remains fallback-only
- [ ] Submit happy path adds new row to Collection
- [ ] Concentration picker, accord chips, and rating dots are interactive
- [ ] Bottle status, bottle size, purchase date, source, price, and currency can be saved when supplied
- [ ] Preferred seasons and day/night/either profile can be saved when supplied
- [ ] Leaving bottle/profile fields blank does not block save or create false defaults
- [ ] Accord chip autocomplete suggests curated descriptors while typing
- [ ] Chip dedup prevents adding the same accord twice

## Detail

- [ ] Tap row and detail renders with correct data
- [ ] Detail shows the bottle's last-worn date near the top when wear history exists
- [ ] Detail shows Bottle and Wear Profile sections only when metadata exists
- [ ] Detail edit can update bottle metadata and wear profile
- [ ] Log today with optional wear note, season, day/night, occasion, compliment count, and compliment note, then success alert appears
- [ ] Detail wear history shows the new wear
- [ ] Edit changes persist
- [ ] Edit Photo URL updates or removes the bottle image
- [ ] Edit Attach photo uploads a replacement personal bottle photo and persists it after Save
- [ ] Edit cancel discards changes
- [ ] Delete confirm removes row from Collection

## Wears

- [ ] Wears tab appears between Collection and Today
- [ ] Month grid renders current month with weekday row
- [ ] A day with a logged wear shows an accent dot
- [ ] Tapping a day shows selected-day detail
- [ ] Pressing the selected-day plus opens bottle choices
- [ ] Choosing a bottle and saving creates a wear for the selected date
- [ ] Season defaults from the selected date and can be cleared or overridden
- [ ] Day/night, occasion, compliment count, and compliment note save for selected-day wears
- [ ] Editing an existing wear preserves/updates its context fields
- [ ] Logged wear appears in the selected-day detail sheet
- [ ] By bottle toggle shows last-worn status and sparkline markers
- [ ] Month previous/next controls navigate without crashing

## Today

- [ ] Today tab appears between Wears and Insights
- [ ] Empty state renders when no wear exists today
- [ ] Logging a wear for today makes it active in Today
- [ ] Logging a second wear for today switches active to the newest wear and keeps the earlier wear in Today's stack
- [ ] Plus increments compliments for the active wear
- [ ] Minus decrements compliments and is disabled at zero
- [ ] Save journal updates the active wear note
- [ ] Tapping a stack row makes that wear current

## Insights

- [ ] Insights tab appears between Today and Add
- [ ] Empty state renders when no fragrance/wear data exists
- [ ] Most worn section ranks bottles with logged wears
- [ ] Neglected bottles includes unworn or oldest-worn bottles
- [ ] Compliment leaders ranks bottles by total compliment count
- [ ] Seasonal favorites and Day / night sections aggregate wear context
- [ ] Taste profile shows top accord families from ratings and wear counts

## Barcode Scan

- [ ] `/scan` asks for camera permission when needed
- [ ] Scanner recognizes UPC/EAN labels and shows matched catalog result
- [ ] Use this match returns to Add with the matched catalog metadata
- [ ] Unknown barcode shows the no-match state with catalog search
- [ ] Selecting a catalog row for an unknown barcode submits a pending barcode link

## Barcode Review

- [ ] Admin user sees the Collection-header review entry and it opens `/barcode-review`
- [ ] `/barcode-review` renders the review screen for an authenticated admin
- [ ] End-to-end barcode loop: unknown scan submission -> review approval -> repeat scan resolves as a catalog match
- [ ] Non-admin authenticated users cannot list, approve, or reject pending barcode submissions
- [ ] An `app_admins` user can list pending barcode submissions
- [ ] Approving a pending submission writes or updates the matching `catalog_barcodes` row
- [ ] Rejecting a pending submission marks it rejected without creating a shared barcode match
- [ ] Full loop follows `docs/barcode-live-smoke-test.md` and records the synthetic barcode used

## Search + Sort

- [ ] Typing a brand substring filters the list
- [ ] Typing an accord substring filters the list
- [ ] Clearing search restores all rows

## RLS Sanity

- [ ] User A can add a fragrance and log a wear
- [ ] User B signs in and does not see User A's fragrance or wears
