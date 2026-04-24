const fs = require('fs');
const path = require('path');

const DEFAULT_INPUT = path.join('..', 'fragrance-data', 'final_perfume_data.csv');
const DEFAULT_OUTPUT = path.join('data', 'catalog', 'perfume-recommendation-catalog.json');

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

function parseNotes(raw) {
  if (!raw) return [];
  return raw
    .replace(/^\[|\]$/g, '')
    .split(/[;,|]/)
    .map((note) => note.replace(/^['"\s]+|['"\s]+$/g, '').trim())
    .filter(Boolean);
}

function normalizeRows(rows) {
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1).map((cells, index) => {
    const row = Object.fromEntries(headers.map((header, i) => [header, cells[i] ?? '']));
    const brand = getField(row, ['brand', 'company']);
    const name = getField(row, ['name', 'perfume', 'perfume_name']);

    return {
      id: `${brand}::${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `perfume-${index + 1}`,
      brand,
      name,
      description: getField(row, ['description', 'desc']),
      notes: parseNotes(getField(row, ['notes', 'fragrance_notes'])),
      imageUrl: getField(row, ['image_url', 'image', 'img_url', 'picture_url']),
      source: 'kaggle:nandini1999/perfume-recommendation-dataset',
    };
  }).filter((entry) => entry.brand && entry.name);
}

function importCatalog(inputPath = DEFAULT_INPUT, outputPath = DEFAULT_OUTPUT) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input CSV not found: ${inputPath}`);
  }

  const csv = fs.readFileSync(inputPath, 'utf8');
  const catalog = normalizeRows(parseCsv(csv));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
  return catalog;
}

if (require.main === module) {
  const inputPath = process.argv[2] || DEFAULT_INPUT;
  const outputPath = process.argv[3] || DEFAULT_OUTPUT;
  const catalog = importCatalog(inputPath, outputPath);
  console.log(`Imported ${catalog.length} perfumes into ${outputPath}`);
}

module.exports = {
  parseCsv,
  parseNotes,
  normalizeRows,
  importCatalog,
};
