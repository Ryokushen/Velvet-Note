# Catalog Image Scraper Contract

The image scraper writes into the shared `catalog_fragrances` table and Supabase Storage. The app reads `catalog_fragrances.image_url` through catalog search and through the shelf image fallback RPC.

## Required Environment

The scraper should use service-role credentials, never the app anon key:

```env
SUPABASE_URL=https://aekzcttzqfwlxbsueqrf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SCRAPER_BUCKET=fragrance-images
```

## Storage Contract

- Bucket: `fragrance-images`
- Public read: yes
- Write access: service role only
- Object key: `<catalog_fragrance_id>.jpg`
- Public URL:

```text
https://aekzcttzqfwlxbsueqrf.supabase.co/storage/v1/object/public/fragrance-images/<catalog_fragrance_id>.jpg
```

## Row Contract

On a successful scrape, update only the matched catalog row:

```sql
update catalog_fragrances
set
  image_url = :public_storage_url,
  image_scraped_at = now(),
  image_scrape_status = 'ok'
where id = :catalog_fragrance_id;
```

For permanent misses:

```sql
update catalog_fragrances
set
  image_scraped_at = now(),
  image_scrape_status = 'not_found'
where id = :catalog_fragrance_id;
```

For retryable failures after retries are exhausted:

```sql
update catalog_fragrances
set
  image_scraped_at = now(),
  image_scrape_status = 'error'
where id = :catalog_fragrance_id;
```

`image_scrape_status` is constrained to `ok`, `not_found`, or `error`.

## Pending Query

The scraper can prioritize user-owned catalog rows before the rest of the catalog:

```sql
select cf.id, cf.parfumo_url
from catalog_fragrances cf
left join fragrances f on f.catalog_id = cf.id::text
where cf.image_scrape_status is null
order by (f.id is not null) desc,
         cf.rating_count desc nulls last
limit :batch_size;
```

## App Read Path

`search_catalog_fragrances(search_text, match_limit)` returns `image_url`. The Add flow maps it to `CatalogFragrance.imageUrl` and shows the bottle art preview.

The collection and detail screens read shelf rows through `list_fragrances_with_catalog_images()`. That function returns:

```sql
coalesce(fragrances.image_url, catalog_fragrances.image_url) as image_url,
fragrances.image_url as personal_image_url,
catalog_fragrances.image_url as catalog_image_url
```

That keeps `fragrances.image_url` user-controlled while still allowing existing catalog-linked shelf rows to show scraper-filled catalog images when no custom user image is set. Detail editing must use `personal_image_url`, not the coalesced display `image_url`, so pressing Save does not copy scraper/catalog fallback imagery into the user's personal photo field.
