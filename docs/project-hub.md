---
tags:
  - project
type: app-idea
status: phase-2-android-preview-ready
---

# Fragrance App

Index: [[Projects Index]]

Personal fragrance collection tracker. Mobile-first (Expo / React Native), Supabase backend, shipped in phases. Catalog-first: brand, name, concentration, accords, personal rating. Phase 1 is tagged; Phase 1.5 has wear logging, Wears month/by-bottle views, selected-day wear entry, curated accord autocomplete, and last-worn summaries on collection/detail. Phase 2 catalog foundation is live: the shared Parfumo Supabase catalog is seeded and Add search can match brand, bottle name, accords, and notes. Catalog image infrastructure is live: scraper status columns, the `fragrance-images` bucket, catalog image RPC output, and shelf fallback from user photo to catalog photo. Personal photo upload is implemented in-app. Barcode linkage uses `catalog_barcodes`; `/scan` resolves matched barcodes into Add prefill and stages unknown barcode links in `catalog_barcode_submissions`. Admin-gated review RPCs can promote or reject pending barcode links, and admins get a Collection-header entry to `/barcode-review`. CSV import tooling is available for vetted external barcode mappings. The personal journal slice is implemented and live-migrated: five tabs (Collection, Wears, Today, Insights, Add), optional bottle metadata, ideal wear profile, richer wear context, active current-day wear, compliment tracking, and client-derived Insights/taste profile. Android preview builds are configured through EAS with preview APK output. LLM fallback remains a Phase 2 follow-up.

Detailed project notes:

- [[Fragrance App Index]]
- [[catalog-barcode-import|Catalog Barcode Import]]
- [[barcode-live-smoke-test|Barcode Live Smoke Test]]
