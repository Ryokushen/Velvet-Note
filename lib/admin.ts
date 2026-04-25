import { supabase } from './supabase';

export async function isAppAdmin(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_app_admin');

    if (error) {
      return false;
    }

    return data === true;
  } catch {
    return false;
  }
}
