/**
 * Pro budget alerts: 80% and 100% for the monthly total and each category.
 */

export type BudgetAlertLevel = '80' | '100';

export type BudgetAlert = {
  id: string;
  level: BudgetAlertLevel;
  label: string;
  spent: number;
  budget: number;
};

export function budgetAlertLevel(spent: number, budget: number): BudgetAlertLevel | null {
  if (!(budget > 0) || !Number.isFinite(spent) || spent < 0) return null;
  if (spent >= budget) return '100';
  if (spent >= budget * 0.8) return '80';
  return null;
}

export function collectBudgetAlerts(input: {
  totalSpent: number;
  totalBudget: number;
  categories: {
    categoryId: string;
    categoryName: string;
    spent: number;
    budgetAmount: number;
  }[];
}): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];
  const totalLevel = budgetAlertLevel(input.totalSpent, input.totalBudget);
  if (totalLevel) {
    alerts.push({
      id: 'total',
      level: totalLevel,
      label: 'Budget bulan ini',
      spent: input.totalSpent,
      budget: input.totalBudget,
    });
  }

  for (const row of input.categories) {
    const level = budgetAlertLevel(row.spent, row.budgetAmount);
    if (!level) continue;
    alerts.push({
      id: row.categoryId,
      level,
      label: row.categoryName,
      spent: row.spent,
      budget: row.budgetAmount,
    });
  }

  return alerts.sort((a, b) => {
    if (a.level !== b.level) return a.level === '100' ? -1 : 1;
    if (a.id === 'total') return -1;
    if (b.id === 'total') return 1;
    return a.label.localeCompare(b.label, 'id');
  });
}

export function budgetAlertMessage(alert: BudgetAlert, money: (amount: number) => string): string {
  const spent = money(alert.spent);
  const budget = money(alert.budget);
  if (alert.id === 'total') {
    return alert.level === '100'
      ? `Budget bulan ini sudah habis (${spent} dari ${budget}).`
      : `Pengeluaran bulan ini sudah melewati 80% budget (${spent} dari ${budget}).`;
  }
  return alert.level === '100'
    ? `Budget kategori ${alert.label} sudah habis (${spent} dari ${budget}).`
    : `Kategori ${alert.label} sudah melewati 80% budgetnya (${spent} dari ${budget}).`;
}

export function budgetAlertStorageKey(
  userId: string,
  month: string,
  alert: Pick<BudgetAlert, 'id' | 'level'>
): string {
  return `dt_budget_alert_sent_${userId}_${month}_${alert.id}_${alert.level}`;
}
