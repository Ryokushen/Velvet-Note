---
tags:
  - project
type: app-idea
status: phase-2-polish-shipped
---

# Fragrance App

Index: [[Projects Index]]

Personal fragrance collection tracker. Mobile-first (Expo / React Native), Supabase backend, shipped in phases. Catalog-first: brand, name, concentration, accords, personal rating. Phase 1 is tagged; Phase 1.5 has wear logging, Wears month/by-bottle views, selected-day wear entry, curated accord autocomplete, and last-worn summaries on collection/detail. Phase 2 catalog foundation is live: the shared Parfumo Supabase catalog is seeded and Add search can match brand, bottle name, accords, and notes. Catalog image infrastructure is live: scraper status columns, the `fragrance-images` bucket, catalog image RPC output, and shelf fallback from user photo to catalog photo. Personal photo upload is implemented in-app. Barcode linkage uses `catalog_barcodes`; `/scan` resolves matched barcodes into Add prefill and stages unknown barcode links in `catalog_barcode_submissions`. Admin-gated review RPCs can promote or reject pending barcode links, and admins get a Collection-header entry to `/barcode-review`. CSV import tooling is available for vetted external barcode mappings. The personal journal slice is implemented and live-migrated: five tabs (Collection, Wears, Today, Insights, Add), optional bottle metadata, ideal wear profile, richer wear context, active current-day wear, compliment tracking, and client-derived Insights/taste profile. The 2026-07-06 wear-intelligence slice puts that data to work — scored Today's-pick suggestions, bottle economics (cost per wear, remaining ml, shelf value), Collection Shelf/Wants/Past segments with wishlist conversion, a persisted grid view, exposed sort and season/neglect filters, long-press quick logging with haptics, a year wear heatmap, expanded Insights (streaks, seasonal signatures, crowd-pleasers, economics), a Year in Review screen, and AsyncStorage-persisted query cache. Collection/Detail now uses a native-stack dissolve-and-lift transition; the earlier measurement-heavy shared-element overlay was retired on 2026-07-10. The 2026-07-17 polish pass (PR #1, merged) shipped an app-wide UI/UX overhaul: bundled Fraunces brand serif with dark-only lock, motion/haptic/accessibility baseline, flow-trap fixes (scan re-fire, search states, permission dead ends, duplicate guards, confirmations), canonical date-key helpers, trigram-indexed catalog search (~50ms, paged results), a searchable recency-ordered wear picker, and transparent bottle art for the whole shelf via a `bottle-art` Supabase bucket with a nightly auto-processor on the dev machine for new bottles. Local Android release builds replace the stale EAS preview APK as the device-testing path (built and smoke-tested on-device 2026-07-17). LLM fallback remains a Phase 2 follow-up.

Detailed project notes:

- [[Fragrance App Index]]
- [[catalog-barcode-import|Catalog Barcode Import]]
- [[barcode-live-smoke-test|Barcode Live Smoke Test]]
