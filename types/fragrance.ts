export type Concentration = 'EDT' | 'EDP' | 'Parfum' | 'Cologne' | 'Other';

export const CONCENTRATIONS: Concentration[] = [
  'EDT',
  'EDP',
  'Parfum',
  'Cologne',
  'Other',
];

export interface Fragrance {
  id: string;
  user_id: string;
  brand: string;
  name: string;
  concentration: Concentration | null;
  accords: string[];
  rating: number | null;
  catalog_id: string | null;
  image_url: string | null;
  catalog_description: string | null;
  catalog_source: string | null;
  created_at: string;
  updated_at: string;
}

export type NewFragrance = {
  brand: string;
  name: string;
  concentration: Concentration | null;
  accords: string[];
  rating: number | null;
  catalog_id?: string | null;
  image_url?: string | null;
  catalog_description?: string | null;
  catalog_source?: string | null;
};

export type FragranceUpdate = Partial<NewFragrance>;
