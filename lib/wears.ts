import { supabase } from './supabase';
import type { NewWear, Wear, WearUpdate } from '../types/wear';

export async function listWears(): Promise<Wear[]> {
  const { data, error } = await supabase
    .from('wears')
    .select('*')
    .order('worn_on', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Wear[];
}

export async function listWearsForFragrance(fragranceId: string): Promise<Wear[]> {
  const { data, error } = await supabase
    .from('wears')
    .select('*')
    .eq('fragrance_id', fragranceId)
    .order('worn_on', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Wear[];
}

export async function createWear(input: NewWear): Promise<Wear> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('wears')
    .insert({ ...input, user_id: user.user.id })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Wear;
}

export async function updateWear(id: string, input: WearUpdate): Promise<Wear> {
  const { data, error } = await supabase
    .from('wears')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Wear;
}

export async function deleteWear(id: string): Promise<void> {
  const { error } = await supabase.from('wears').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
