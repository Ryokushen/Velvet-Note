# Manual Smoke Tests

Run this checklist on a dev build before any demo or release.

## Setup

- [ ] `.env.local` contains valid Supabase URL + anon key
- [ ] Migrations applied: `fragrances`, `wears`, and `catalog_fragrances` tables exist in Supabase
- [ ] `search_catalog_fragrances(search_text, match_limit)` RPC exists and is granted to anon/authenticated users
- [ ] `catalog_barcodes` table and `find_catalog_fragrance_by_barcode(barcode_text)` RPC exist for exact barcode lookup
- [ ] `catalog_barcode_submissions` table exists and authenticated users can insert their own pending barcode links
- [ ] `app_admins` allowlist and barcode review RPCs exist for promoting/rejecting pending submissions
- [ ] `fragrance-images` Storage bucket exists and is public-read
- [ ] `user-fragrance-photos` Storage bucket exists, is public-read, and authenticated users can write only under their own user-id folder
- [ ] `list_fragrances_with_catalog_images()` RPC exists for shelf image fallback

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
- [ ] Accord chip autocomplete suggests curated descriptors while typing
- [ ] Chip dedup prevents adding the same accord twice

## Detail

- [ ] Tap row and detail renders with correct data
- [ ] Log today with optional wear note and success alert appears
- [ ] Detail wear history shows the new wear
- [ ] Edit changes persist
- [ ] Edit Photo URL updates or removes the bottle image
- [ ] Edit Attach photo uploads a replacement personal bottle photo and persists it after Save
- [ ] Edit cancel discards changes
- [ ] Delete confirm removes row from Collection

## Calendar

- [ ] Calendar tab appears between Collection and Add
- [ ] Month grid renders current month with weekday row
- [ ] A day with a logged wear shows an accent dot
- [ ] Tapping a day shows selected-day detail
- [ ] Pressing the selected-day plus opens bottle choices
- [ ] Choosing a bottle and saving creates a wear for the selected date
- [ ] Logged wear appears in the selected-day detail sheet
- [ ] By bottle toggle shows last-worn status and sparkline markers
- [ ] Month previous/next controls navigate without crashing

## Barcode Scan

- [ ] `/scan` asks for camera permission when needed
- [ ] Scanner recognizes UPC/EAN labels and shows matched catalog result
- [ ] Use this match returns to Add with the matched catalog metadata
- [ ] Unknown barcode shows the no-match state with catalog search
- [ ] Selecting a catalog row for an unknown barcode submits a pending barcode link

## Barcode Review

- [ ] Non-admin authenticated users cannot list, approve, or reject pending barcode submissions
- [ ] An `app_admins` user can list pending barcode submissions
- [ ] Approving a pending submission writes or updates the matching `catalog_barcodes` row
- [ ] Rejecting a pending submission marks it rejected without creating a shared barcode match

## Search + Sort

- [ ] Typing a brand substring filters the list
- [ ] Typing an accord substring filters the list
- [ ] Clearing search restores all rows

## RLS Sanity

- [ ] User A can add a fragrance and log a wear
- [ ] User B signs in and does not see User A's fragrance or wears
