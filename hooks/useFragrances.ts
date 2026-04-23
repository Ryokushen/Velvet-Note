import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listFragrances,
  createFragrance,
  updateFragrance,
  deleteFragrance,
} from '../lib/fragrances';
import type { NewFragrance, FragranceUpdate } from '../types/fragrance';

export function useFragrancesQuery() {
  return useQuery({ queryKey: ['fragrances'], queryFn: listFragrances });
}

export function useCreateFragrance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewFragrance) => createFragrance(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fragrances'] }),
  });
}

export function useUpdateFragrance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FragranceUpdate }) =>
      updateFragrance(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fragrances'] }),
  });
}

export function useDeleteFragrance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFragrance(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fragrances'] }),
  });
}
