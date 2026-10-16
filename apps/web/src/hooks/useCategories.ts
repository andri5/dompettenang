/**
 * Dompet Tenang - Category Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { QUERY_KEYS } from '@/lib/constants';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/services/category.service';
import type {
  CreateCategoryData,
  TransactionType,
  UpdateCategoryData,
} from '@/types';
import { useUIStore } from '@/stores';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

/**
 * Hook to fetch all categories
 */
export function useCategories(type?: TransactionType) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CATEGORIES, type || 'ALL'],
    queryFn: () => getCategories(type),
  });
}

/**
 * Hook for category mutations (create, update, delete)
 */
export function useCategoryMutations() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryData) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES });
      addNotification({
        type: 'success',
        title: 'Kategori berhasil ditambahkan',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Gagal menambahkan kategori',
        message: getErrorMessage(error, 'Silakan coba lagi'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryData }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES });
      addNotification({
        type: 'success',
        title: 'Kategori berhasil diperbarui',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Gagal memperbarui kategori',
        message: getErrorMessage(error, 'Silakan coba lagi'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES });
      addNotification({
        type: 'success',
        title: 'Kategori berhasil dihapus',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Gagal menghapus kategori',
        message: getErrorMessage(
          error,
          'Kategori default tidak dapat dihapus'
        ),
      });
    },
  });

  return {
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation,
  };
}
