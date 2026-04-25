/* global describe, expect, it */

const {
  DEFAULT_SOURCE,
  getBarcodeType,
  getSupabaseEnv,
  normalizeBarcode,
  normalizeBarcodeLinkages,
  parseCsv,
} = require('../scripts/import-catalog-barcodes');

const catalogId = '11111111-1111-4111-8111-111111111111';
const otherCatalogId = '22222222-2222-4222-8222-222222222222';

describe('import-catalog-barcodes', () => {
  it('parses CSV rows and normalizes barcode linkages', () => {
    const csv = [
      'Barcode,Catalog Fragrance ID,Source,Product Label,Size',
      `"EAN 3348901321129","${catalogId}","retailer_feed","Dior Sauvage","100 ml"`,
    ].join('\n');

    const rows = normalizeBarcodeLinkages(parseCsv(csv));

    expect(rows).toEqual([
      {
        barcode: '3348901321129',
        barcode_type: 'ean_13',
        catalog_fragrance_id: catalogId,
        source: 'retailer_feed',
        product_label: 'Dior Sauvage',
        size_text: '100 ml',
      },
    ]);
  });

  it('supports simple column aliases and defaults source', () => {
    const csv = ['UPC,Catalog ID', `0 12345-67890 5,${otherCatalogId}`].join('\n');

    const rows = normalizeBarcodeLinkages(parseCsv(csv));

    expect(rows[0]).toMatchObject({
      barcode: '012345678905',
      barcode_type: 'upc_a',
      catalog_fragrance_id: otherCatalogId,
      source: DEFAULT_SOURCE,
    });
  });

  it('normalizes only valid 8-14 digit barcodes', () => {
    expect(normalizeBarcode('ean_13=3348901321129')).toBe('3348901321129');
    expect(normalizeBarcode('1234567')).toBe('');
    expect(normalizeBarcode('123456789012345')).toBe('');
    expect(normalizeBarcode('abc')).toBe('');
  });

  it('maps known barcode lengths to catalog barcode types', () => {
    expect(getBarcodeType('12345678')).toBe('ean_8');
    expect(getBarcodeType('123456789012')).toBe('upc_a');
    expect(getBarcodeType('1234567890123')).toBe('ean_13');
    expect(getBarcodeType('12345678901234')).toBe('gtin_14');
    expect(getBarcodeType('123456789')).toBe('unknown');
  });

  it('fails clearly for invalid rows without hitting the network', () => {
    const csv = [
      'Barcode,Catalog Fragrance ID',
      `abc,${catalogId}`,
      '012345678905,',
      '3348901321129,not-a-uuid',
    ].join('\n');

    expect(() => normalizeBarcodeLinkages(parseCsv(csv))).toThrow(
      [
        'Invalid barcode linkage CSV:',
        'Row 2: barcode must normalize to 8-14 digits',
        'Row 3: missing catalog_fragrance_id',
        'Row 4: catalog_fragrance_id must be a UUID',
      ].join('\n'),
    );
  });

  it('requires service-role credentials for database imports', () => {
    expect(() =>
      getSupabaseEnv({
        EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      }),
    ).toThrow('The anon key cannot upsert catalog_barcodes');

    expect(
      getSupabaseEnv({
        EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      }),
    ).toEqual({
      supabaseUrl: 'https://example.supabase.co',
      supabaseKey: 'service-role-key',
    });
  });
});
