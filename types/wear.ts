import type { Season } from './fragrance';

export type WearTimeOfDay = 'day' | 'night';

export interface Wear {
  id: string;
  user_id: string;
  fragrance_id: string;
  worn_on: string;
  notes: string | null;
  season?: Season | null;
  time_of_day?: WearTimeOfDay | null;
  occasion?: string | null;
  compliment_count?: number;
  compliment_note?: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export type NewWear = {
  fragrance_id: string;
  worn_on: string;
  notes: string | null;
  season?: Season | null;
  time_of_day?: WearTimeOfDay | null;
  occasion?: string | null;
  compliment_count?: number;
  compliment_note?: string | null;
  is_active?: boolean;
};

export type WearUpdate = Partial<NewWear>;
