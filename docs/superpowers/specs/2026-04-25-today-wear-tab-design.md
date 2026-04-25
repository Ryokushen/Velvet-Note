# Today Wear Tab Design

## Summary

Add a new **Today** tab for quickly managing whatever the user is currently wearing. It is a focused day-of-use surface: show the active fragrance photo, increment/decrement compliments, and keep a quick journal note without making the user dig through Wears or Detail.

The tab uses a hybrid model. Logging a wear for today makes that wear active automatically, but the user can switch the active wear among today's logged wears. This supports a common morning/night pattern: a morning fragrance can remain in today's stack while the night fragrance becomes active.

## Goals

- Add a fast place to update compliments throughout the day.
- Keep the same fragrance photo and identity users already see in Collection/Detail.
- Let one day contain multiple wears without losing earlier entries.
- Reuse the existing `wears` model rather than introducing a heavier session system.
- Keep all updates attached to the actual wear record so Wears and Insights stay consistent.

## Non-Goals

- No separate amount tracking.
- No new long-form diary system beyond the existing wear note/journal field.
- No weather, longevity, projection, or reapplication tracking in this slice.
- No multi-day active wear. The tab is scoped to the current local date.

## Navigation

The visible tab order becomes:

1. Collection
2. Wears
3. Today
4. Insights
5. Add

The tab label should be **Today**, not **Now**, because it represents the full day stack while still emphasizing the active current wear.

## Data Model

Use the existing `wears` table as the source of truth. Add one nullable/boolean active marker for the current-day workflow.

Recommended field:

```sql
alter table public.wears
  add column if not exists is_active boolean not null default false;
```

Behavior rules:

- Only one wear per user per `worn_on` date should be active at a time.
- Creating a wear for today's local date sets it active and clears active state from other wears for that user/date.
- Creating or editing a wear for another date does not affect the Today tab.
- Manually selecting a wear from today's stack sets that wear active and clears active state from the others for today.
- Clearing active state leaves today's stack visible, but the tab should fall back to the newest wear for today if no row is marked active.

The existing `compliment_count`, `compliment_note`, and `notes` fields remain the editable Today fields. The journal entry is the wear `notes` field for v1; a separate journal table can wait until there is a real need for multiple entries or timestamps.

## Today Tab UI

### Empty State

If no wear exists for today:

- Show a quiet empty state: "Nothing logged today."
- Provide a primary action to log a wear from Wears or Collection.
- Do not show fake active data.

### Active Wear Card

When today's wear exists:

- Header label: "Currently wearing"
- Brand/name
- Bottle photo using the same image precedence as Detail: personal image, then catalog fallback, then placeholder.
- Context row from wear data when available: time of day, season, occasion.
- Compliment control:
  - Large count
  - Minus button on the left
  - Plus button on the right
  - Minus disabled at `0`
  - Updates persist directly to the active wear
- Journal field:
  - Multiline text field bound to `wears.notes`
  - V1 uses an explicit Save action to avoid accidental overwrites.
- Compliment note:
  - Keep this available, but lower priority than the main journal field. It can live under the compliment stepper or as a compact optional field.

### Today's Stack

Below the active card, show all wears for today's date:

- Active wear highlighted.
- Each row shows fragrance brand/name, time of day or created time, and compliment count.
- Tapping a row makes it active.
- The stack allows quick switching between morning and night wears.

## Data Flow

### Creating Today's Wear

From Detail "Log today" or Wears selected-day form:

1. Create the wear row.
2. If `worn_on` equals today's local date, mark it active.
3. Invalidate/update the `wears` query.
4. Today tab reflects the new active wear.

### Updating Compliments

From Today tab:

1. User taps `+` or `-`.
2. Clamp value at zero.
3. Optimistically update the active wear in local query cache.
4. Persist with `updateWear(id, { compliment_count })`.
5. Roll back or refetch on failure and show a concise error.

### Updating Journal

From Today tab:

1. User edits journal text.
2. User taps Save.
3. Persist with `updateWear(id, { notes })`.
4. Keep the field editable if save fails.

### Switching Active Wear

From Today's stack:

1. User taps a wear row.
2. Clear `is_active` from other wears for today.
3. Set selected wear `is_active = true`.
4. Refresh query data.

Use a Supabase RPC for active switching so one code path enforces the one-active-wear-per-user/day rule.

## Error Handling

- Compliment update failure: restore previous count and show "Could not update compliments."
- Journal save failure: keep unsaved text in the field and show "Could not save journal."
- Active switch failure: keep the previous active wear selected and show "Could not switch current wear."
- Missing fragrance for a wear: show "Unknown bottle" and keep the wear editable enough to preserve notes/compliments.

## Testing

### Unit / Derived Logic

- Select active wear for today:
  - active row wins
  - newest today row is fallback when none active
  - non-today wears are ignored
- Compliment decrement clamps at zero.

### Component Tests

- Today empty state renders when no wear exists today.
- Today active card renders fragrance photo/name and current compliment count.
- Plus increments and persists `compliment_count`.
- Minus decrements and cannot go below zero.
- Journal Save persists `notes`.
- Tapping a stack row switches active wear.

### Integration / Smoke

- Log a morning wear for today from Detail; Today tab shows it active.
- Log a night wear for today from Wears; Today tab switches active to the new wear and keeps morning in stack.
- Add a compliment from Today; Wears and Insights reflect the updated count.

## Implementation Decision

Active switching should use a small Supabase RPC:

```sql
set_active_wear(wear_id uuid)
```

The RPC should verify ownership, find the selected wear's `worn_on` date, clear active state for the user's other wears on that date, and set the selected wear active in one transaction.
