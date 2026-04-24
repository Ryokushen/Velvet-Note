const { parseCsv, normalizeRows } = require('../scripts/import-kaggle-perfumes');

describe('import-kaggle-perfumes', () => {
  it('parses quoted CSV values and normalizes catalog rows', () => {
    const csv = [
      'Name,Brand,Description,Notes,Image URL',
      '"Bleu de Chanel","Chanel","Fresh, woody profile","Citrus; Cedar; Amber","https://example.com/bleu.jpg"',
    ].join('\n');

    const rows = normalizeRows(parseCsv(csv));

    expect(rows).toEqual([
      {
        id: 'chanel-bleu-de-chanel',
        brand: 'Chanel',
        name: 'Bleu de Chanel',
        description: 'Fresh, woody profile',
        notes: ['Citrus', 'Cedar', 'Amber'],
        imageUrl: 'https://example.com/bleu.jpg',
        source: 'kaggle:nandini1999/perfume-recommendation-dataset',
      },
    ]);
  });

  it('supports alternate perfume column names', () => {
    const csv = [
      'Perfume,Company,Fragrance Notes,Img URL',
      'Sauvage,Dior,"Bergamot|Pepper|Ambroxan",https://example.com/sauvage.jpg',
    ].join('\n');

    const rows = normalizeRows(parseCsv(csv));

    expect(rows[0]).toMatchObject({
      id: 'dior-sauvage',
      brand: 'Dior',
      name: 'Sauvage',
      notes: ['Bergamot', 'Pepper', 'Ambroxan'],
      imageUrl: 'https://example.com/sauvage.jpg',
    });
  });
});
