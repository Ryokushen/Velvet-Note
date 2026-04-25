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
  personal_image_url?: string | null;
  catalog_image_url?: string | null;
  catalog_description: string | null;
  catalog_source: string | null;
  catalog_release_year: number | null;
  catalog_notes_top: string[] | null;
  catalog_notes_middle: string[] | null;
  catalog_notes_base: string[] | null;
  catalog_perfumers: string[] | null;
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
  catalog_release_year?: number | null;
  catalog_notes_top?: string[] | null;
  catalog_notes_middle?: string[] | null;
  catalog_notes_base?: string[] | null;
  catalog_perfumers?: string[] | null;
};

export type FragranceUpdate = Partial<NewFragrance>;
