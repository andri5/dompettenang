/**
 * Dompet Tenang - Expense / Income Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
} from '@/services/expense.service';
import type {
  CreateExpenseData,
  ExpenseFilters,
  TransactionType,
  UpdateExpenseData,
} from '@/types';
import { useUIStore } from '@/stores';

function labels(type: TransactionType = 'EXPENSE') {
  return type === 'INCOME'
    ? {
        listKey: QUERY_KEYS.INCOMES,
        itemKey: QUERY_KEYS.INCOME,
        created: 'Pemasukan berhasil ditambahkan',
        createFailed: 'Gagal menambahkan pemasukan',
        updated: 'Pemasukan berhasil diperbarui',
        updateFailed: 'Gagal memperbarui pemasukan',
        deleted: 'Pemasukan berhasil dihapus',
        deleteFailed: 'Gagal menghapus pemasukan',
      }
    : {
        listKey: QUERY_KEYS.EXPENSES,
        itemKey: QUERY_KEYS.EXPENSE,
        created: 'Pengeluaran berhasil ditambahkan',
        createFailed: 'Gagal menambahkan pengeluaran',
        updated: 'Pengeluaran berhasil diperbarui',
        updateFailed: 'Gagal memperbarui pengeluaran',
        deleted: 'Pengeluaran berhasil dihapus',
        deleteFailed: 'Gagal menghapus pengeluaran',
      };
}

export function useExpenses(filters?: ExpenseFilters) {
  const type = filters?.type || 'EXPENSE';
  const key = type === 'INCOME' ? QUERY_KEYS.INCOMES : QUERY_KEYS.EXPENSES;

  return useQuery({
    queryKey: [...key, filters],
    queryFn: () => getExpenses({ ...filters, type }),
  });
}

export function useExpense(id: string, type: TransactionType = 'EXPENSE') {
  return useQuery({
    queryKey: type === 'INCOME' ? QUERY_KEYS.INCOME(id) : QUERY_KEYS.EXPENSE(id),
    queryFn: () => getExpense(id),
    enabled: !!id,
  });
}

export function useExpenseMutations(type: TransactionType = 'EXPENSE') {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  const copy = labels(type);

  const createMutation = useMutation({
    mutationFn: (data: CreateExpenseData) =>
      createExpense({ ...data, type: data.type || type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: copy.listKey });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD });
      addNotification({ type: 'success', title: copy.created });
    },
    onError: () => {
      addNotification({ type: 'error', title: copy.createFailed });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseData }) =>
      updateExpense(id, { ...data, type: data.type || type }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: copy.listKey });
      queryClient.invalidateQueries({ queryKey: copy.itemKey(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD });
      addNotification({ type: 'success', title: copy.updated });
    },
    onError: () => {
      addNotification({ type: 'error', title: copy.updateFailed });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: copy.listKey });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD });
      addNotification({ type: 'success', title: copy.deleted });
    },
    onError: () => {
      addNotification({ type: 'error', title: copy.deleteFailed });
    },
  });

  return {
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation,
  };
}
