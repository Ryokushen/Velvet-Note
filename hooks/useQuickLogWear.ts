import { useCallback, useState } from 'react';
import { useCreateWear, useSetActiveWear } from './useWears';
import { seasonForDate } from '../lib/journal';
import { todayLocalDate } from '../lib/todayWear';
import { notifySuccess, notifyWarning } from '../lib/haptics';
import type { Fragrance } from '../types/fragrance';

export type QuickLogResult = 'logged' | 'error';

/**
 * One-tap wear logging with sensible defaults: today's date, auto season,
 * marked as the current active wear — mirroring the Detail log flow.
 */
export function useQuickLogWear() {
  const createWear = useCreateWear();
  const setActiveWear = useSetActiveWear();
  const [pendingFragranceId, setPendingFragranceId] = useState<string | null>(null);

  const quickLog = useCallback(
    async (fragrance: Fragrance): Promise<QuickLogResult> => {
      if (pendingFragranceId) return 'error';
      setPendingFragranceId(fragrance.id);
      try {
        const todayKey = todayLocalDate();
        const created = await createWear.mutateAsync({
          fragrance_id: fragrance.id,
          worn_on: todayKey,
          notes: null,
          season: seasonForDate(todayKey),
          time_of_day: null,
          occasion: null,
          compliment_count: 0,
          compliment_note: null,
        });
        try {
          await setActiveWear.mutateAsync(created.id);
        } catch {
          // The wear saved; failing to mark it current is not worth surfacing here.
        }
        notifySuccess();
        return 'logged';
      } catch {
        notifyWarning();
        return 'error';
      } finally {
        setPendingFragranceId(null);
      }
    },
    [createWear, pendingFragranceId, setActiveWear],
  );

  return { quickLog, pendingFragranceId };
}
