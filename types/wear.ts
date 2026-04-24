export interface Wear {
  id: string;
  user_id: string;
  fragrance_id: string;
  worn_on: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type NewWear = {
  fragrance_id: string;
  worn_on: string;
  notes: string | null;
};

export type WearUpdate = Partial<Pick<NewWear, 'fragrance_id' | 'worn_on' | 'notes'>>;
