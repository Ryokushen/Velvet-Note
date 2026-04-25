---
tags:
  - project
type: import-note
status: ready
date: 2026-04-25
---

# Catalog Barcode Import

Use this path for vetted external barcode mapping data that links UPC/EAN/GTIN values to existing `catalog_fragrances.id` rows.

## Command

```bash
npm run import:barcodes -- path/to/barcode-linkages.csv
```

The importer writes to `public.catalog_barcodes`, so it requires service-role Supabase credentials:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

The anon key is intentionally rejected for imports because `catalog_barcodes` is public-read only.

## CSV Columns

Required:

- `barcode` (aliases: `upc`, `ean`, `gtin`)
- `catalog_fragrance_id` (aliases: `catalog_id`, `fragrance_id`, `catalog_fragrance_uuid`)

Optional:

- `source` (defaults to `barcode_linkage_import`)
- `product_label`
- `size_text`

Barcodes are normalized to digits only and must resolve to 8-14 digits. `catalog_fragrance_id` must be a UUID.

## Example

```csv
barcode,catalog_fragrance_id,source,product_label,size_text
3348901321129,11111111-1111-4111-8111-111111111111,retailer_feed,Dior Sauvage,100 ml
```

## Safety Notes

- Import only mappings from sources you are allowed to use.
- Keep raw vendor/source files outside the repo unless their license allows check-in.
- Use a small sample first and scan the resulting barcode in `/scan` before importing large batches.
- The importer upserts by `barcode`, so reruns can replace the linked catalog row for an existing code.
