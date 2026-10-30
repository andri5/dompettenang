import { describe, expect, it } from 'vitest';
import {
  budgetAlertLevel,
  budgetAlertMessage,
  budgetAlertStorageKey,
  collectBudgetAlerts,
} from '@/lib/budgetAlerts';

const money = (amount: number) => String(amount);

describe('budgetAlertLevel', () => {
  it('stays quiet under 80%', () => {
    expect(budgetAlertLevel(79_999, 100_000)).toBeNull();
  });

  it('warns from 80% until just under the limit', () => {
    expect(budgetAlertLevel(80_000, 100_000)).toBe('80');
    expect(budgetAlertLevel(99_999, 100_000)).toBe('80');
  });

  it('treats the limit and anything above it as 100%', () => {
    expect(budgetAlertLevel(100_000, 100_000)).toBe('100');
    expect(budgetAlertLevel(120_000, 100_000)).toBe('100');
  });

  it('ignores a missing budget', () => {
    expect(budgetAlertLevel(10, 0)).toBeNull();
  });
});

describe('collectBudgetAlerts', () => {
  it('puts the total and spent-out budgets ahead of 80% warnings', () => {
    const alerts = collectBudgetAlerts({
      totalSpent: 90_000,
      totalBudget: 100_000,
      categories: [
        { categoryId: 'food', categoryName: 'Makanan', spent: 50_000, budgetAmount: 40_000 },
        { categoryId: 'transport', categoryName: 'Transport', spent: 8_000, budgetAmount: 10_000 },
        { categoryId: 'fun', categoryName: 'Hiburan', spent: 1_000, budgetAmount: 10_000 },
      ],
    });

    expect(alerts.map((alert) => `${alert.id}:${alert.level}`)).toEqual([
      'food:100',
      'total:80',
      'transport:80',
    ]);
  });
});

describe('budget alert copy and keys', () => {
  it('writes a distinct message and storage key per threshold', () => {
    const alert = {
      id: 'total',
      level: '80' as const,
      label: 'Budget bulan ini',
      spent: 80,
      budget: 100,
    };
    expect(budgetAlertMessage(alert, money)).toContain('80%');
    expect(budgetAlertStorageKey('user-1', '2026-10', alert)).toBe(
      'dt_budget_alert_sent_user-1_2026-10_total_80'
    );
    expect(
      budgetAlertStorageKey('user-1', '2026-10', { ...alert, level: '100' })
    ).not.toBe(budgetAlertStorageKey('user-1', '2026-10', alert));
  });
});
