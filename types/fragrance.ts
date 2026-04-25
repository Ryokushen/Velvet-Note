export type Concentration = 'EDT' | 'EDP' | 'Parfum' | 'Cologne' | 'Other';
export type BottleStatus = 'full' | 'partial' | 'sample' | 'decant' | 'empty' | 'wishlist' | 'sold' | 'gifted';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type PreferredTimeOfDay = 'day' | 'night' | 'either';

export const CONCENTRATIONS: Concentration[] = [
  'EDT',
  'EDP',
  'Parfum',
  'Cologne',
  'Other',
];

export const BOTTLE_STATUSES: BottleStatus[] = [
  'full',
  'partial',
  'sample',
  'decant',
  'empty',
  'wishlist',
  'sold',
  'gifted',
];

export const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];
export const PREFERRED_TIMES_OF_DAY: PreferredTimeOfDay[] = ['day', 'night', 'either'];

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
  bottle_status?: BottleStatus | null;
  bottle_size_ml?: number | null;
  purchase_date?: string | null;
  purchase_source?: string | null;
  purchase_price?: number | null;
  purchase_currency?: string | null;
  preferred_seasons?: Season[] | null;
  preferred_time_of_day?: PreferredTimeOfDay | null;
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
  bottle_status?: BottleStatus | null;
  bottle_size_ml?: number | null;
  purchase_date?: string | null;
  purchase_source?: string | null;
  purchase_price?: number | null;
  purchase_currency?: string | null;
  preferred_seasons?: Season[] | null;
  preferred_time_of_day?: PreferredTimeOfDay | null;
};

export type FragranceUpdate = Partial<NewFragrance>;
