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
  created_at: string;
  updated_at: string;
}

export type NewFragrance = {
  brand: string;
  name: string;
  concentration: Concentration | null;
  accords: string[];
  rating: number | null;
};

export type FragranceUpdate = Partial<NewFragrance>;
