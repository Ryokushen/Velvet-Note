# Parfumo Catalog Import

Source: Parfumo TidyTuesday snapshot, 2024-12-10.

This import seeds the shared Phase 2 `catalog_fragrances` table. It does not seed or overwrite personal rows in the Phase 1 `fragrances` table.

## Files

Seed artifacts stay outside this repo:

```text
C:\Users\charl\Artificial\Obsidian\Obsidian Vault\fragrance-data\
```

Repo-owned import files:

```text
supabase/migrations/20260424010000_catalog_fragrances.sql
supabase/imports/parfumo_migrate.sql
```

Do not commit the raw CSV, zip, or generated `parfumo_seed.csv`.

## External Seed Artifacts

```text
fragrance-data/
├── parfumo_data_clean.csv
├── normalize_parfumo.py
├── parfumo_seed.csv
├── parfumo_schema.sql
└── parfumo_migrate.sql
```

The repo migration/import SQL is the canonical app version. The external SQL files are useful as source notes from the normalization pass.

## Windows `psql`

This workstation has a user-local PostgreSQL client installed at:

```text
C:\Users\charl\Tools\PostgreSQL\16.2\pgsql\bin\psql.exe
```

That bin directory is saved to the user PATH for future PowerShell sessions. New terminals can call `psql` directly; the current terminal can use the full path if PATH has not refreshed yet.

Use a session-pooler connection string for IPv4 networks. Keep the password in the local environment or prompt entry, not in the repo.

## Import

Apply the repo migration through the normal Supabase migration path first. If applying manually with `psql`:

```powershell
psql $env:SUPABASE_DB_URL -f "supabase/migrations/20260424010000_catalog_fragrances.sql"
```

Copy the external seed into the staging table:

```powershell
psql $env:SUPABASE_DB_URL -c "\copy catalog_fragrances_staging FROM 'C:/Users/charl/Artificial/Obsidian/Obsidian Vault/fragrance-data/parfumo_seed.csv' WITH (FORMAT csv, HEADER true)"
```

Upsert into the shared catalog and print the sanity report:

```powershell
psql $env:SUPABASE_DB_URL -f "supabase/imports/parfumo_migrate.sql"
```

The import SQL truncates `catalog_fragrances_staging` after a successful upsert so future refreshes can repeat the `\copy` and upsert steps.

Current production import, 2026-04-24:

- staged rows copied: `59,324`
- distinct catalog rows upserted: `59,280`
- staging rows after cleanup: `0`
- search ranking migration applied: `20260424030000_catalog_search_rank.sql`

App lookup uses `search_catalog_fragrances(search_text, match_limit)` so the Add flow can search brand, bottle name, accords, and top/middle/base notes through a single RPC. Migration `20260424030000_catalog_search_rank.sql` updates ranking to prioritize match quality and exact note position before falling back to rating count.

## Table Boundary

- `catalog_fragrances` is shared, read-only to app users, and seeded from external public catalog data.
- `fragrances` remains user-scoped and stores bottles personally saved to the shelf.
- A personal fragrance references a catalog row through optional catalog metadata without making the catalog itself user-owned.
