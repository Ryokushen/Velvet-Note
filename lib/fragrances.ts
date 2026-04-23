import { supabase } from './supabase';
import type { Fragrance, NewFragrance, FragranceUpdate } from '../types/fragrance';

export async function listFragrances(): Promise<Fragrance[]> {
  const { data, error } = await supabase
    .from('fragrances')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Fragrance[];
}

export async function createFragrance(input: NewFragrance): Promise<Fragrance> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('fragrances')
    .insert({ ...input, user_id: user.user.id })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Fragrance;
}

export async function updateFragrance(
  id: string,
  input: FragranceUpdate,
): Promise<Fragrance> {
  const { data, error } = await supabase
    .from('fragrances')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Fragrance;
}

export async function deleteFragrance(id: string): Promise<void> {
  const { error } = await supabase.from('fragrances').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
