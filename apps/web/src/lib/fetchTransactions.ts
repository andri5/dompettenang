/**
 * Fetch all transactions for a date range (paginated)
 */

import { getExpenses } from '@/services/expense.service';
import type { Expense } from '@/types';

export async function fetchAllTransactionsForRange(
  startDate: string,
  endDate: string
): Promise<Expense[]> {
  const pageSize = 100;
  const all: Expense[] = [];

  // Fetch both types without type filter to get everything in one stream,
  // then also support separate calls if API requires type — API type is optional.
  let page = 1;
  let totalPages = 1;

  do {
    const result = await getExpenses({
      page,
      limit: pageSize,
      startDate,
      endDate,
      sortBy: 'date',
      sortOrder: 'desc',
    });
    all.push(...result.data);
    totalPages = result.pagination.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  return all;
}
