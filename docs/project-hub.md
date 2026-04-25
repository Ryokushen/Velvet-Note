---
tags:
  - project
type: app-idea
status: phase-2-barcode-review-ui-ready
---

# Fragrance App

Index: [[Projects Index]]

Personal fragrance collection tracker. Mobile-first (Expo / React Native), Supabase backend, shipped in phases. Catalog-first: brand, name, concentration, accords, personal rating. Phase 1 is tagged; Phase 1.5 has wear logging, Calendar month/by-bottle views, selected-day wear entry, and curated accord autocomplete. Phase 2 catalog foundation is live: the shared Parfumo Supabase catalog is seeded and Add search can match brand, bottle name, accords, and notes. Catalog image infrastructure is live: scraper status columns, the `fragrance-images` bucket, catalog image RPC output, and shelf fallback from user photo to catalog photo. Personal photo upload is implemented in-app. Barcode linkage uses `catalog_barcodes`; `/scan` resolves matched barcodes into Add prefill and stages unknown barcode links in `catalog_barcode_submissions`. Admin-gated review RPCs can promote or reject pending barcode links, and `/barcode-review` is the hidden admin review route. LLM fallback remains a Phase 2 follow-up.

Detailed project notes:

- [[Fragrance App Index]]
