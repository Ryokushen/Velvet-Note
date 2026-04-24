---
tags:
  - project
type: index
---

# Fragrance App Index

Hub: [[Fragrance App]]

Status: `local-catalog-lookup-shipped` (as of 2026-04-24). Phase 1 is tagged at commit `8cb9d66`; Phase 1.5 wear logging landed in `6adf961`; the mockup-driven Calendar tab landed in `6a38a9a`; the local catalog/accord follow-ups landed in `0fca8be`, `ca4222e`, and `deb5846`.

**Velvet Note UI refresh (2026-04-23, commit `e3f8dce`):** UI rebuilt from the Claude Design handoff: editorial sign-in hero, giant Georgia rating numeral, 10-dot rating input, family-tinted accord chips, `NotesRows` labeled top/heart/base, Feather iconography. Same fix resolved an Android sign-in regression where group paths (`/(auth)/sign-in`, `/(tabs)`) did not match Expo Router runtime pathnames; redirects now use `/` and `/sign-in`, and `useAuth` is a Provider-backed context. Full trace: `CHANGELOG.md`.

**Phase 1.5 Calendar (2026-04-24, commit `6a38a9a`):** `wears` data model is live in Supabase, fragrance detail can log today's wear with an optional note, and the Calendar tab now follows the checked-in Velvet Note handoff: Month grid, selected-day detail sheet, and By bottle segmented view. Source handoff is under `docs/design-handoff/velvet-note/`.

**Local catalog and Calendar follow-ups (2026-04-24):** `0fca8be` added accord autocomplete and selected-date Calendar wear entry; `ca4222e` added the Kaggle import pipeline and normalized local catalog; `deb5846` wired Add-screen catalog lookup/prefill. Supabase catalog persistence, barcode scanning, and moderation remain Phase 2.

Personal fragrance collection tracker. Mobile-first Expo + Supabase, shipped in phases. Core job is a searchable catalog of the bottles I own. Working name in code is "Fragrance App"; public UI name is *Velvet Note*. UI/UX biases toward a premium collector aesthetic from day one.

**Repo location:**
- Windows: `C:\Users\593528\Documents\Project AI\Velvet-Note`
- GitHub: https://github.com/Ryokushen/Velvet-Note

## Notes

- [[Fragrance App - Design Spec]]
Approved design spec: motivation, architecture, data model, phased roadmap (1 -> 1.5 -> 2 -> 3 -> 4), error handling, and testing strategy.

- [[Fragrance App - Phase 1 Implementation Plan]]
Historical 26-task plan for Phase 1. Phase 1 is tagged; Apple/Google auth remain deferred to Phase 4.

- [[Fragrance App - Phase 1.5 Status]]
Current implementation notes for wear logging, the Calendar tab, accord autocomplete, and local catalog lookup.

- [[Fragrance App - Design Brief]]
Original paste-into-Figma companion. Superseded for Calendar by the checked-in handoff under `docs/design-handoff/velvet-note/`; still useful for tokens and unresolved Phase 2 imagery/note hierarchy decisions.

- [[Fragrance App - Designer Engagement Brief]]
Historical first-person prompt used to request the handoff.

## Related

- [[Fragrance App]]
Top-level project hub and entry point from the Projects index.
