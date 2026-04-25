import { readFileSync } from 'fs';
import path from 'path';

describe('personal journal migration', () => {
  it('adds bottle metadata, wear profile, and wear context columns', () => {
    const migration = readFileSync(
      path.join(__dirname, '..', 'supabase/migrations/20260425020000_personal_journal_fields.sql'),
      'utf8',
    );

    expect(migration).toContain('bottle_status');
    expect(migration).toContain('bottle_size_ml');
    expect(migration).toContain('purchase_source');
    expect(migration).toContain('preferred_seasons');
    expect(migration).toContain('preferred_time_of_day');
    expect(migration).toContain('compliment_count');
    expect(migration).toContain('compliment_note');
    expect(migration).toContain('list_fragrances_with_catalog_images');
  });
});
