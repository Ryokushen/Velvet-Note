const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const DEFAULT_SOURCE = 'barcode_linkage_import';
const DEFAULT_BATCH_SIZE = 500;

const FIELD_ALIASES = {
  barcode: ['barcode', 'upc', 'ean', 'gtin'],
  catalogFragranceId: [
    'catalog_fragrance_id',
    'catalog_id',
    'fragrance_id',
    'catalog_fragrance_uuid',
  ],
  source: ['source', 'data_source', 'barcode_source'],
  productLabel: ['product_label', 'label', 'product_name'],
  sizeText: ['size_text', 'size', 'volume'],
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(value);
      value = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value);
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  return rows;
}

function normalizeHeader(header) {
  return header
    .toLowerCase()
    .replace(/^\uFEFF/, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getField(row, aliases) {
  for (const alias of aliases) {
    const value = row[alias];
    if (value != null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
}

function normalizeBarcode(value) {
  const payload = String(value ?? '').split(/[:=]/).pop() ?? '';
  const digits = payload.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 14 ? digits : '';
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function getBarcodeType(barcode) {
  switch (barcode.length) {
    case 8:
      return 'ean_8';
    case 12:
      return 'upc_a';
    case 13:
      return 'ean_13';
    case 14:
      return 'gtin_14';
    default:
      return 'unknown';
  }
}

function csvRowsToObjects(rows) {
  if (rows.length === 0) return [];

  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1).map((cells, index) => ({
    rowNumber: index + 2,
    row: Object.fromEntries(headers.map((header, i) => [header, cells[i] ?? ''])),
  }));
}

function normalizeLinkageRow(row, rowNumber) {
  const rawBarcode = getField(row, FIELD_ALIASES.barcode);
  const barcode = normalizeBarcode(rawBarcode);
  const catalogFragranceId = getField(row, FIELD_ALIASES.catalogFragranceId);
  const source = getField(row, FIELD_ALIASES.source) || DEFAULT_SOURCE;
  const productLabel = getField(row, FIELD_ALIASES.productLabel);
  const sizeText = getField(row, FIELD_ALIASES.sizeText);
  const errors = [];

  if (!rawBarcode) {
    errors.push('missing barcode');
  } else if (!barcode) {
    errors.push('barcode must normalize to 8-14 digits');
  }

  if (!catalogFragranceId) {
    errors.push('missing catalog_fragrance_id');
  } else if (!isUuid(catalogFragranceId)) {
    errors.push('catalog_fragrance_id must be a UUID');
  }
  if (!source) errors.push('missing source');

  if (errors.length > 0) {
    throw new Error(`Row ${rowNumber}: ${errors.join('; ')}`);
  }

  const linkage = {
    barcode,
    barcode_type: getBarcodeType(barcode),
    catalog_fragrance_id: catalogFragranceId,
    source,
  };

  if (productLabel) linkage.product_label = productLabel;
  if (sizeText) linkage.size_text = sizeText;

  return linkage;
}

function normalizeBarcodeLinkages(rows) {
  const failures = [];
  const linkages = [];

  for (const { row, rowNumber } of csvRowsToObjects(rows)) {
    try {
      linkages.push(normalizeLinkageRow(row, rowNumber));
    } catch (error) {
      failures.push(error.message);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Invalid barcode linkage CSV:\n${failures.join('\n')}`);
  }

  return linkages;
}

function readBarcodeLinkages(inputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input CSV not found: ${inputPath}`);
  }

  return normalizeBarcodeLinkages(parseCsv(fs.readFileSync(inputPath, 'utf8')));
}

function getSupabaseEnv(env = process.env) {
  const supabaseUrl = env.SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase credentials. Set SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL, ' +
        'and SUPABASE_SERVICE_ROLE_KEY. The anon key cannot upsert catalog_barcodes.',
    );
  }

  return { supabaseUrl, supabaseKey };
}

async function upsertBarcodeLinkages(linkages, options = {}) {
  const batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
  const client =
    options.client ||
    createClient(options.supabaseUrl, options.supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

  for (let index = 0; index < linkages.length; index += batchSize) {
    const batch = linkages.slice(index, index + batchSize);
    const { error } = await client
      .from('catalog_barcodes')
      .upsert(batch, { onConflict: 'barcode' });

    if (error) {
      throw new Error(`Failed to upsert barcode rows ${index + 1}-${index + batch.length}: ${error.message}`);
    }
  }
}

async function importBarcodeLinkages(inputPath, options = {}) {
  const linkages = readBarcodeLinkages(inputPath);
  const env = options.client ? {} : getSupabaseEnv(options.env);
  await upsertBarcodeLinkages(linkages, { ...env, ...options });
  return linkages;
}

if (require.main === module) {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error('Usage: npm run import:barcodes -- path/to/barcodes.csv');
    process.exit(1);
  }

  importBarcodeLinkages(inputPath)
    .then((linkages) => {
      console.log(`Upserted ${linkages.length} barcode linkages into catalog_barcodes`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = {
  DEFAULT_SOURCE,
  parseCsv,
  normalizeBarcode,
  isUuid,
  getBarcodeType,
  normalizeBarcodeLinkages,
  readBarcodeLinkages,
  getSupabaseEnv,
  upsertBarcodeLinkages,
  importBarcodeLinkages,
};
