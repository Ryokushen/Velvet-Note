# Kaggle Perfume Recommendation Dataset Import

Source: https://www.kaggle.com/datasets/nandini1999/perfume-recommendation-dataset/data

Use this as the first local catalog source for bottle images and descriptive fragrance information. The dataset includes perfume name, brand, description, notes, and image URL fields.

Parfumo is now the preferred Phase 2 shared catalog seed. See `docs/parfumo-catalog-import.md` for the Supabase `catalog_fragrances` import path. Keep the Kaggle import available as the lightweight local Add-screen lookup and image source until the shared catalog API replaces it.

## License

Kaggle lists this dataset as `CC0: Public Domain`. Keep the source identifier on each normalized row so imported catalog data remains traceable.

## Download

Download the CSV from Kaggle and place it one directory above this repo at:

```text
../fragrance-data/final_perfume_data.csv
```

The raw Kaggle file should stay outside the vault and outside the app repo. The importer reads from that external path and writes only the normalized app catalog into this repo.

## Normalize

Run:

```bash
npm run import:kaggle
```

This writes:

```text
data/catalog/perfume-recommendation-catalog.json
```

Each row is normalized to:

```json
{
  "id": "brand-name-slug",
  "brand": "Brand",
  "name": "Perfume Name",
  "description": "Description text",
  "notes": ["Note 1", "Note 2"],
  "imageUrl": "https://example.com/image.jpg",
  "source": "kaggle:nandini1999/perfume-recommendation-dataset"
}
```

## App Integration

The Add screen reads `data/catalog/perfume-recommendation-catalog.json` locally for catalog lookup. Selecting a result prefills brand, name, and accords while still saving a normal user-owned row in `fragrances`.

Keep this catalog separate from Supabase until the lookup behavior and normalized fields feel right. The next persistence step is a `catalog_fragrances` table so a personal bottle can reference a catalog entry without copying every external field into the user's collection row.
