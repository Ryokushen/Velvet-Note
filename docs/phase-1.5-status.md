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

Phase 1.5 wear logging and the Calendar UI are shipped on `main`. The remaining items below are follow-on improvements, not blockers for this phase.

Shipped:

- `wears` Supabase table with RLS, owner checks, indexes, and `updated_at` trigger.
- Wear data layer: `types/wear.ts`, `lib/wears.ts`, `hooks/useWears.ts`.
- Service tests in `__tests__/wears.test.ts`.
- Fragrance detail "Log today" flow with optional note.
- Calendar tab between Collection and Add.
- Calendar Month view with day dots and selected-day detail sheet.
- Calendar By bottle view with last-worn labels and sparkline markers.
- Velvet Note handoff checked in under `docs/design-handoff/velvet-note/`.

Key commits:

- `6adf961` - wear logging foundation.
- `6a38a9a` - mockup-driven calendar view.

Live Supabase project:

- Project ref: `aekzcttzqfwlxbsueqrf` (`velvet-note`).
- Migration applied through Supabase MCP as `wears`.

## Verification

Static checks passed after the Calendar implementation:

```powershell
npm.cmd test -- --runInBand
npm.cmd run lint
.\node_modules\.bin\tsc.cmd --noEmit
```

Browser workflow was verified with Playwright against Expo web on `http://localhost:8091` because `agent-browser` was not available on PATH:

1. Sign up with a temporary test user.
2. Add a test bottle.
3. Log today's wear from fragrance detail.
4. Open `/calendar`.
5. Confirm Month mode renders the selected-day sheet.
6. Switch to By bottle and confirm the logged bottle appears.

Temporary test users were removed from Supabase after verification.

## Intentional Gaps

- Day-sheet plus button currently routes users toward logging from a fragrance detail screen; arbitrary past-date logging is not implemented yet.
- Wear editing/deleting UI is not implemented yet, although service functions exist.
- Calendar does not yet show multiple dots/counts for multiple wears on the same day; it uses the first wear's accent dot.
- Detail/list do not yet surface "last worn" summary outside the detail wear history section.
- No dedicated E2E test suite yet; Playwright was used as an ad hoc smoke check.

## Next Good Slice

Add a date-aware wear entry flow:

- Tap a Calendar day.
- Press the plus action.
- Pick one fragrance from the user's collection.
- Save a `wears` row for the selected date.
- Refresh the selected-day detail and By bottle view.
