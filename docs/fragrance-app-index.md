---
tags:
  - project
type: index
---

# Fragrance App Index

Hub: [[Fragrance App]]

Status: `phase-1-core-complete` (as of 2026-04-23 — Tasks 1–21, 24, 25 shipped; 22/23 deferred to Phase 4; 26 pending smoke test + dogfood)

**Velvet Note UI refresh (2026-04-23, commit `e3f8dce`):** UI rebuilt from the Claude Design handoff — editorial sign-in hero, giant Georgia rating numeral, 10-dot rating input, family-tinted accord chips, `NotesRows` labeled top/heart/base, Feather iconography. Same fix also resolved an Android sign-in regression where group paths (`/(auth)/sign-in`, `/(tabs)`) didn't match Expo Router's runtime pathnames; redirects now use `/` and `/sign-in`, and `useAuth` is a Provider-backed context. Full trace: `CHANGELOG.md`.

Personal fragrance collection tracker. Mobile-first Expo + Supabase, shipped in phases. Core job is a searchable catalog of the bottles I own. Working name is "Fragrance App"; leading public-name candidate is *Velvet Note*. UI/UX biases toward a premium collector aesthetic from day one.

**Repo location:**
- Mac: `~/Artificial/Obsidian/Fragrance App/`
- GitHub: https://github.com/Ryokushen/Velvet-Note

## Notes

- [[Fragrance App - Design Spec]]
Approved design spec: motivation, architecture, data model, phased roadmap (1 → 1.5 → 2 → 3 → 4), error handling, and testing strategy.

- [[Fragrance App - Phase 1 Implementation Plan]]
26 bite-sized tasks to ship Phase 1 (scaffold, Supabase, auth, 4 screens, Velvet Note theme, manual smoke tests).

- [[Fragrance App - Design Brief]]
Paste-into-Figma companion: locked Phase 1 tokens (palette, type, spacing) plus open design questions (imagery, note hierarchy, accords, calendar, motion, iconography).

- [[Fragrance App - Designer Engagement Brief]]
First-person prompt to send to a hired UI/UX designer. Describes the aesthetic intent, what's locked, what's open, scope for the first Figma deliverable.

## Related

- [[Fragrance App]]
Top-level project hub and entry point from the Projects index.
