import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createWear,
  deleteWear,
  listWears,
  listWearsForFragrance,
  setActiveWear,
  updateWear,
} from '../lib/wears';
import type { NewWear, WearUpdate } from '../types/wear';

export function useWearsQuery() {
  return useQuery({ queryKey: ['wears'], queryFn: listWears });
}

export function useFragranceWearsQuery(fragranceId: string | null | undefined) {
  return useQuery({
    queryKey: ['wears', 'fragrance', fragranceId],
    queryFn: () => listWearsForFragrance(fragranceId!),
    enabled: Boolean(fragranceId),
  });
}

export function useCreateWear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewWear) => createWear(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wears'] }),
  });
}

export function useUpdateWear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: WearUpdate }) =>
      updateWear(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wears'] }),
  });
}

export function useSetActiveWear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (wearId: string) => setActiveWear(wearId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wears'] }),
  });
}

export function useDeleteWear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWear(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wears'] }),
  });
}
