---
tags:
  - project
type: index
---

# Fragrance App Index

Hub: [[Fragrance App]]

Status: `phase-2-personal-journal-ready` (as of 2026-04-25). Phase 1 is tagged at commit `8cb9d66`; Phase 1.5 wear logging landed in `6adf961`; the mockup-driven Calendar tab landed in `6a38a9a`; the local catalog/accord follow-ups landed in `0fca8be`, `ca4222e`, and `deb5846`; the shared Supabase catalog path landed through `23e9433`, `785737c`, `ba9ba7c`, and `5c820df`. The current Phase 2 slice adds richer catalog metadata, delete/back fixes, editable photo URLs, live catalog image infrastructure for scraper backfill, self-attached personal photo uploads, barcode mapping, a dedicated scanner route, pending links for unknown barcodes, admin-gated review RPCs, an admin-only Collection entry for barcode review, barcode import tooling, a barcode live smoke checklist, last-worn summaries on collection/detail, a four-tab journal shell, optional bottle metadata, richer wear context, compliment tracking, and client-derived Insights/taste profile.

**Velvet Note UI refresh (2026-04-23, commit `e3f8dce`):** UI rebuilt from the Claude Design handoff: editorial sign-in hero, giant Georgia rating numeral, 10-dot rating input, family-tinted accord chips, `NotesRows` labeled top/heart/base, Feather iconography. Same fix resolved an Android sign-in regression where group paths (`/(auth)/sign-in`, `/(tabs)`) did not match Expo Router runtime pathnames; redirects now use `/` and `/sign-in`, and `useAuth` is a Provider-backed context. Full trace: `CHANGELOG.md`.

**Phase 1.5 Wears (2026-04-24, commit `6a38a9a`):** `wears` data model is live in Supabase, fragrance detail can log today's wear with an optional note, collection/detail show last-worn summaries, and the Wears tab follows the checked-in Velvet Note handoff: Month grid, selected-day detail sheet, and By bottle segmented view. Source handoff is under `docs/design-handoff/velvet-note/`.

**Catalog, imagery, Wears, and journal follow-ups (2026-04-24 to 2026-04-25):** `0fca8be` added accord autocomplete and selected-date Wears entry; `ca4222e` added the Kaggle import pipeline and normalized local catalog; `deb5846` wired Add-screen catalog lookup/prefill. `23e9433` added the Parfumo import path, `785737c` persisted selected catalog metadata on shelf entries, `ba9ba7c` moved Add search to the Supabase RPC, and `5c820df` improved note-search ranking plus scrollable results. The live catalog now also has scraper-ready image columns, a `fragrance-images` public bucket, catalog search image output, and shelf reads that prefer a user photo before falling back to the linked catalog image. Personal photo upload is implemented with `expo-image-picker` and the `user-fragrance-photos` bucket. Barcode linkage has `catalog_barcodes`, exact lookup RPC, a dedicated `/scan` screen, pending unknown-barcode submissions, review RPCs for allowlisted admins, an admin-only Collection entry for `/barcode-review`, and CSV import tooling for external barcode mappings. The personal journal roadmap slice adds optional bottle status/size/purchase metadata, preferred seasons/day-night profile, season/day-night/occasion/compliment fields on wears, and an Insights tab that derives wear intelligence and taste profile on-device. Apply the local personal journal migration before expecting those new fields on the live Supabase project. LLM fallback remains Phase 2.

Personal fragrance collection tracker. Mobile-first Expo + Supabase, shipped in phases. Core job is a searchable catalog of the bottles I own. Working name in code is "Fragrance App"; public UI name is *Velvet Note*. UI/UX biases toward a premium collector aesthetic from day one.

**Repo location:**
- Windows: `C:\Users\charl\Artificial\Obsidian\Obsidian Vault\Velvet-Note`
- GitHub: https://github.com/Ryokushen/Velvet-Note

## Notes

- [[Fragrance App - Design Spec]]
Approved design spec: motivation, architecture, data model, phased roadmap (1 -> 1.5 -> 2 -> 3 -> 4), error handling, and testing strategy.

- [[Fragrance App - Phase 1 Implementation Plan]]
Historical 26-task plan for Phase 1. Phase 1 is tagged; Apple/Google auth remain deferred to Phase 4.

- [[Fragrance App - Phase 1.5 Status]]
Current implementation notes for wear logging, the Wears tab, accord autocomplete, shared catalog search, catalog image backfill readiness, and the personal journal/Insights slice.

- [[Catalog Image Scraper Contract]]
Database, Storage, and app-read contract for the external scraper that populates catalog bottle images.

- [[Catalog Barcode Import]]
CSV import path for vetted external UPC/EAN/GTIN-to-catalog mappings.

- [[Barcode Live Smoke Test]]
Manual loop for unknown scan submission, admin approval, and repeat-scan resolution.

- [[Fragrance App - Design Brief]]
Original paste-into-Figma companion. Superseded for Wears by the checked-in handoff under `docs/design-handoff/velvet-note/`; still useful for tokens and historical imagery/note hierarchy context.

- [[Fragrance App - Designer Engagement Brief]]
Historical first-person prompt used to request the handoff.

## Related

- [[Fragrance App]]
Top-level project hub and entry point from the Projects index.
