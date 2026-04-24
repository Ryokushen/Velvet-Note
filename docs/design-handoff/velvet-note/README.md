# Velvet Note Design Handoff

Source: `Velvet Note.zip`, extracted into this repo on 2026-04-24. The original local download path is no longer relevant.

This is the current UI reference for the Velvet Note visual system after the initial Phase 1 implementation.

Important files:

- `Velvet Note.html` - runnable design canvas.
- `design-canvas.jsx` - canvas composition.
- `components/tokens.jsx` - palette, type, radius, spacing, icons.
- `components/screens.jsx` - Phase 1 screen mockups and tab structure.
- `components/calendar.jsx` - Phase 1.5 Calendar source of truth.
- `components/detail.jsx` - detail screen v2 / imagery direction.
- `components/notes.jsx`, `components/ratings.jsx`, `components/motion.jsx` - focused explorations.
- `uploads/design-brief.md` - original brief used for the handoff; it intentionally preserves pre-implementation wording.

Implemented from this handoff:

- Calendar tab between Collection and Add.
- Month grid as the default Calendar view.
- Selected-day detail sheet.
- By bottle segmented view with last-worn rows and sparkline markers.

Keep this folder as reference material. Product code should live in `app/`, `components/`, `hooks/`, `lib/`, `theme/`, and `types/`.
