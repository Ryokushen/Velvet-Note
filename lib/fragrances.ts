import { supabase } from './supabase';
import type { Fragrance, NewFragrance, FragranceUpdate } from '../types/fragrance';

export async function listFragrances(): Promise<Fragrance[]> {
  const { data, error } = await supabase.rpc('list_fragrances_with_catalog_images') as {
    data: Fragrance[] | null;
    error: { code?: string; message: string } | null;
  };
  if (isMissingCatalogImageRpc(error)) {
    return listFragrancesFromTable();
  }
  if (error) throw new Error(error.message);
  return (data ?? []) as Fragrance[];
}

async function listFragrancesFromTable(): Promise<Fragrance[]> {
  const { data, error } = await supabase
    .from('fragrances')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Fragrance[];
}

function isMissingCatalogImageRpc(error: { code?: string; message?: string } | null): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { code?: string; message?: string };
  return (
    maybeError.code === 'PGRST202' ||
    maybeError.code === '42883' ||
    maybeError.message?.includes('list_fragrances_with_catalog_images') === true
  );
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
