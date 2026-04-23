---
tags: [project, design]
type: brief
status: draft
date: 2026-04-23
---

# Velvet Note — Design Brief

Working companion to [design-spec.md](./design-spec.md) and [phase-1-plan.md](./phase-1-plan.md). Paste this into the first frame of a Figma file and build the mockups inside those constraints.

## Product in one line

A premium personal fragrance catalog. Not Fragrantica. Not a spreadsheet. The phone you pull out to remember which Chanel you bought.

## What's locked (ship-fixed for Phase 1)

These are in code at `theme/` — mockups should match, not reinterpret.

### Palette (dark-only, Phase 1)

| Token | Hex | Intended use |
|---|---|---|
| `background` | `#0F0E0D` | App background |
| `surface` | `#1A1917` | Cards, inputs |
| `surfaceElevated` | `#252320` | Chips, raised cards |
| `border` | `#2F2C28` | Hairlines, input borders |
| `text` | `#EDE6DA` | Primary text (bone) |
| `textDim` | `#B5AD9E` | Secondary text |
| `textMuted` | `#7F7869` | Captions, placeholders |
| `accent` | `#8B3A3A` | Single accent — muted oxblood |
| `accentMuted` | `#5E2828` | Selected pill background |
| `error` | `#C4594F` | Destructive actions, error alerts |
| `success` | `#6A8E5A` | Success feedback (unused so far) |

One accent. Do not introduce a second brand color in Phase 1 without explicit scope.

### Typography

- **Display / Title:** Georgia, weight 400, letter-spacing 0.2. Editorial, not decorative.
- **Body:** system sans, weight 400. No custom font files in Phase 1.
- **Caption:** 12px, uppercase, letter-spacing 0.5 — use for labels, brand-above-name, metadata.
- Custom-font swap is allowed only if it clearly elevates the collector feel. Defer to Phase 4.

### Spacing & radius

- Base scale: 4 / 8 / 16 / 24 / 32 / 48 (xs–xxl). Do not introduce intermediates.
- Radius: 4 / 8 / 16 (sm/md/lg). Pill / capsule shapes allowed for chips but implement via radius.lg or height/2.

### Navigation shape

- Root stack → auth group OR tabs group (auth gate handles the switch).
- Tabs: Collection | Add. Detail screen `fragrance/[id]` is stack-pushed, not a tab.
- Header on Collection has sign-out on the right.
- Phase 1.5 adds a Calendar tab between Collection and Add.

### Data shape

A fragrance has: brand, name, concentration (EDT/EDP/Parfum/Cologne/Other), accords (free-text array), rating (0–10, 0.5 step). No image field yet.

## What's open (design freely)

These are unresolved and the mockup is the right place to resolve them.

- **Bottle imagery.** Biggest gap in the current UI. Design should assume a hero image slot in detail view and a small thumb in the list row; schema can catch up in Phase 2 when we add barcode / catalog lookup. Until then, mockups should show how the list and detail feel *with* and *without* images.
- **Note hierarchy.** Fragrances have top / heart / base notes. Phase 1 data collapses these into a single accords array. Design should explore showing structure (e.g. three rows, or a visual tree) as a Phase 2 upgrade.
- **Accord presentation.** Currently plain text chips. Consider: two-tone chips (warm/fresh/woody families), a guided taxonomy, or leaving free-text and styling nicely. Pick a direction.
- **Rating visualization.** Currently the raw number "8.5". Explore: horizontal bar, 10-dot row, or leave the numeral but make it a hero element on detail.
- **Empty & loading states.** Phase 1 has functional empty states — design versions that feel like the product, not the framework default.
- **Wear Calendar (Phase 1.5).** Entire screen is unbuilt. This is the highest-leverage place to spend design time right now. Monthly grid with a glyph or color per day? A horizontal week ribbon? A fragrance-centric view ("last worn 6d ago") vs. a calendar-centric view?
- **Motion.** Current app uses no custom animation. Define one or two signature transitions (detail expand, rating tick, chip press) that feel tactile without being showy.
- **Iconography.** `@expo/vector-icons` is installed, unused so far. Pick a family (SF Symbols–like via `expo-symbols`, or Feather, or custom). One family, not three.

## Scope for first mockup file

Don't try to design the whole phased roadmap. Start with:

1. **Current Phase 1 screens at full fidelity** — sign-in, collection list (empty, populated, searching), add form, detail (read mode, edit mode). Use real palette and tokens. Fix what feels wrong, flag what you want to change in code.
2. **Phase 1.5 calendar screen** — one good exploration of the month view plus a day-detail state.
3. **Detail v2 with hero imagery** — show what the screen could be if we add an image field. Worth it to push for Phase 2.

Skip: barcode flow, shared catalog browsing, settings, paywall. Phase 2+.

## Constraints to keep in mind

- **Premium, not ornate.** Every flourish is suspect. Restraint is the aesthetic.
- **Phone-first composition.** Design at iPhone 15 Pro width (393pt). Test that a 2-thumb reach covers the primary actions.
- **Dark only for now.** A light theme is a Phase 4 discussion.
- **No custom fonts yet.** Georgia is the placeholder serif. If mockups demand a specific serif (Canela, GT Sectra, Tiempos, etc.), mark it as a Phase 4 change, not a blocker.
- **No brand logos in-app.** Brand is typeset, not imaged. Avoids licensing and keeps the aesthetic consistent.
- **Accessibility:** contrast ratio ≥ 4.5:1 for body text on `background`. Check `textDim` / `textMuted` before using them on anything important.

## Deliverables (suggested)

- One Figma file, frames grouped: `Phase 1 Current`, `Phase 1.5 Calendar`, `Detail v2 (w/ imagery)`, `Design Tokens`.
- Optional: export a short "what changed and why" note back into this doc when the mockups land.
