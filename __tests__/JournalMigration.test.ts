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

  it('adds active wear column, index, and RPC', () => {
    const migration = readFileSync(
      path.join(__dirname, '..', 'supabase/migrations/20260425030000_today_active_wear.sql'),
      'utf8',
    );

    expect(migration).toContain('add column if not exists is_active boolean');
    expect(migration).toContain('wears_one_active_per_user_day_idx');
    expect(migration).toContain('create or replace function public.set_active_wear');
    expect(migration).toContain('grant execute on function public.set_active_wear(uuid) to authenticated');
  });
});
