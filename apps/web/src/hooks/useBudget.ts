import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteBudget, getBudgetStatus, saveBudget } from '@/services/budget.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { SaveBudgetData } from '@/types';

export function useBudget(month?: string) {
  const queryClient = useQueryClient();
  const key = QUERY_KEYS.BUDGET(month);

  const query = useQuery({
    queryKey: key,
    queryFn: () => getBudgetStatus(month),
  });

  const saveMutation = useMutation({
    mutationFn: (data: SaveBudgetData) => saveBudget(data),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.BUDGET(data.month), data);
      queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (targetMonth: string) => deleteBudget(targetMonth),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
  });

  return {
    budget: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    saveBudget: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    deleteBudget: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
