/**
 * Dompet Tenang - Category Service
 * API calls for category management
 */

import api from '@/lib/api';
import type {
  ApiResponse,
  Category,
  CreateCategoryData,
  TransactionType,
  UpdateCategoryData,
} from '@/types';

/**
 * Get all categories for the current user
 */
export async function getCategories(type?: TransactionType): Promise<Category[]> {
  const params = type ? `?type=${type}` : '';
  const response = await api.get<ApiResponse<Category[]>>(`/categories${params}`);
  return response.data.data;
}

/**
 * Get a single category by ID
 */
export async function getCategory(id: string): Promise<Category> {
  const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
  return response.data.data;
}

/**
 * Create a new category
 */
export async function createCategory(
  data: CreateCategoryData
): Promise<Category> {
  const response = await api.post<ApiResponse<Category>>('/categories', data);
  return response.data.data;
}

/**
 * Update a category
 */
export async function updateCategory(
  id: string,
  data: UpdateCategoryData
): Promise<Category> {
  const response = await api.put<ApiResponse<Category>>(
    `/categories/${id}`,
    data
  );
  return response.data.data;
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}
