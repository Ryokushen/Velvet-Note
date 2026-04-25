---
tags:
  - project
type: app-idea
status: phase-2-personal-photo-ready
---

# Fragrance App

Index: [[Projects Index]]

Personal fragrance collection tracker. Mobile-first (Expo / React Native), Supabase backend, shipped in phases. Catalog-first: brand, name, concentration, accords, personal rating. Phase 1 is tagged; Phase 1.5 has wear logging, Calendar month/by-bottle views, selected-day wear entry, and curated accord autocomplete. Phase 2 catalog foundation is live: the shared Parfumo Supabase catalog is seeded and Add search can match brand, bottle name, accords, and notes. Catalog image infrastructure is live: scraper status columns, the `fragrance-images` bucket, catalog image RPC output, and shelf fallback from user photo to catalog photo. Personal photo upload is implemented in-app with a pending live Storage migration for the `user-fragrance-photos` bucket. Barcode scanning, contribution/moderation, and LLM fallback remain Phase 2 follow-ups.

Detailed project notes:

- [[Fragrance App Index]]
