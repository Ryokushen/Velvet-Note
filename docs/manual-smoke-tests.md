# Manual Smoke Tests — Phase 1

Run this entire checklist on a dev build before any demo or release.

## Setup
- [ ] `.env.local` contains valid Supabase URL + anon key
- [ ] Migration applied — `fragrances` table exists in Supabase

## Auth
- [ ] Fresh install → sign-in screen shown (no stale session)
- [ ] Create account with new email+password → routed to Collection
- [ ] Sign out → back to sign-in screen
- [ ] Sign in with existing credentials → routed to Collection
- [ ] Wrong password → friendly error shown, no crash
- [ ] Apple Sign In (iOS dev build only) → routed to Collection *(deferred — Phase 4)*
- [ ] Google Sign In → routed to Collection *(deferred — Phase 4)*

## Collection list
- [ ] Empty state shown when no fragrances
- [ ] Pull to refresh works
- [ ] Network off → cached data renders (React Query), error state on hard refresh

## Add
- [ ] Brand + name required → blocked with alert if missing
- [ ] Submit happy path → new row appears top of list (if sorted by recent) or by rating
- [ ] Concentration picker, accord chips, rating slider all interactive
- [ ] Chip dedup — can't add the same accord twice

## Detail
- [ ] Tap row → detail renders with correct data
- [ ] Edit → changes persist
- [ ] Edit → cancel discards changes
- [ ] Delete → confirm → row removed from list

## Search + sort
- [ ] Typing a brand substring filters the list
- [ ] Typing an accord substring filters the list
- [ ] Clearing the search restores all rows

## RLS sanity (requires 2 test accounts)
- [ ] User A can add a fragrance
- [ ] User B signs in — does NOT see User A's fragrance
