/**
 * Dompet Tenang - Budget Management Page
 */

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, PiggyBank, Plus, Trash2 } from 'lucide-react';
import { MainLayout, PageHeader, PageTransition } from '@/components/layout';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Modal, ModalFooter } from '@/components/ui';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { useBudget } from '@/hooks/useBudget';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/useToast';
import { formatCurrency, cn } from '@/lib/utils';
import { formatAmountInput, parseAmountInput } from '@/lib/amountInput';
import { BudgetProgress } from './components/BudgetProgress';

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(month: string) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
}

function formatNominal(n: number) {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(n);
}

export function BudgetPage() {
  const toast = useToast();
  const [month, setMonth] = useState(currentMonthValue());
  const { budget, isLoading, saveBudget, isSaving, deleteBudget, isDeleting } = useBudget(month);
  const { data: categories = [] } = useCategories('EXPENSE');

  const [totalBudget, setTotalBudget] = useState('');
  const [categoryAmounts, setCategoryAmounts] = useState<Record<string, string>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!budget) return;
    setTotalBudget(
      budget.hasBudget ? formatAmountInput(String(Math.round(budget.totalBudget))) : ''
    );
    const next: Record<string, string> = {};
    budget.categoryBudgets.forEach((row) => {
      next[row.categoryId] = formatAmountInput(String(Math.round(row.budgetAmount)));
    });
    setCategoryAmounts(next);
  }, [budget, month]);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'EXPENSE'),
    [categories]
  );

  const handleSave = async () => {
    const parsedTotal = parseAmountInput(totalBudget);
    if (!parsedTotal || parsedTotal <= 0) {
      toast.error('Total budget harus lebih dari 0');
      return;
    }

    const categoryBudgets = expenseCategories
      .map((cat) => {
        const raw = categoryAmounts[cat.id]?.trim();
        if (!raw) return null;
        const amount = parseAmountInput(raw);
        if (!amount || amount <= 0) return null;
        return { categoryId: cat.id, amount };
      })
      .filter(Boolean) as { categoryId: string; amount: number }[];

    try {
      await saveBudget({
        month,
        totalBudget: parsedTotal,
        categoryBudgets,
      });
      toast.success('Budget berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan budget');
    }
  };

  const handleDelete = async () => {
    if (!budget?.hasBudget) return;
    try {
      await deleteBudget(month);
      setTotalBudget('');
      setCategoryAmounts({});
      setShowDeleteModal(false);
      toast.success('Budget dihapus');
    } catch {
      toast.error('Gagal menghapus budget');
    }
  };

  const addCategoryRow = (categoryId: string) => {
    setCategoryAmounts((prev) => ({ ...prev, [categoryId]: prev[categoryId] ?? '' }));
  };

  return (
    <MainLayout>
      <PageTransition>
        <PageHeader
          eyebrow="Anggaran"
          title="Budget Bulanan"
          description="Atur limit pengeluaran total dan per kategori. Peringatan muncul saat pemakaian ≥ 80%."
        />

        <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-primary" />
                Atur Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-muted">Bulan</label>
                <Input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-muted">
                  Total budget pengeluaran
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: 5.000.000"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(formatAmountInput(e.target.value))}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">Budget per kategori (opsional)</p>
                </div>
                {expenseCategories.map((cat) => {
                  const enabled = categoryAmounts[cat.id] !== undefined;
                  if (!enabled) {
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => addCategoryRow(cat.id)}
                        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-line px-3 py-2 text-left text-sm text-muted transition hover:border-primary hover:text-primary"
                      >
                        <Plus className="h-4 w-4" />
                        Tambah limit {cat.name}
                      </button>
                    );
                  }
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-3"
                    >
                      <CategoryIcon icon={cat.icon} size={18} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{cat.name}</p>
                        <Input
                          inputMode="numeric"
                          placeholder="Limit kategori"
                          value={categoryAmounts[cat.id] ?? ''}
                          onChange={(e) => {
                            const v = formatAmountInput(e.target.value);
                            setCategoryAmounts((prev) => ({
                              ...prev,
                              [cat.id]: v,
                            }));
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSave} isLoading={isSaving}>
                  Simpan budget
                </Button>
                {budget?.hasBudget ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(true)}
                    isLoading={isDeleting}
                    className="text-danger"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress {formatMonthLabel(month)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-muted">Memuat progress…</p>
              ) : budget?.hasBudget ? (
                <>
                  {(budget.isNearLimit || budget.isOverLimit) && (
                    <div
                      className={cn(
                        'flex items-start gap-2 rounded-xl px-3 py-2 text-sm',
                        budget.isOverLimit
                          ? 'bg-danger-light text-danger'
                          : 'bg-warning-light text-warning'
                      )}
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        {budget.isOverLimit
                          ? 'Budget total sudah melewati limit!'
                          : 'Budget total sudah ≥ 80%. Pertimbangkan untuk mengurangi pengeluaran.'}
                      </p>
                    </div>
                  )}

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-ink">Total</span>
                      <span className="text-muted">
                        {formatNominal(budget.totalSpent)} / {formatNominal(budget.totalBudget)}
                      </span>
                    </div>
                    <BudgetProgress
                      percent={budget.percentUsed}
                      nearLimit={budget.isNearLimit}
                      overLimit={budget.isOverLimit}
                    />
                    <p className="mt-1 text-xs text-muted">
                      Sisa {formatNominal(budget.totalRemaining)} ({budget.percentUsed}% terpakai)
                    </p>
                  </div>

                  {budget.categoryBudgets.length > 0 ? (
                    <div className="space-y-3 border-t border-line pt-4">
                      <p className="text-sm font-semibold text-ink">Per kategori</p>
                      {budget.categoryBudgets.map((row) => (
                        <div key={row.categoryId}>
                          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                            <span className="truncate font-medium text-ink">{row.categoryName}</span>
                            <span className="shrink-0 text-muted">
                              {formatCurrency(row.spent)} / {formatCurrency(row.budgetAmount)}
                            </span>
                          </div>
                          <BudgetProgress
                            size="sm"
                            percent={row.percentUsed}
                            nearLimit={row.isNearLimit}
                            overLimit={row.isOverLimit}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted">
                  Belum ada budget untuk bulan ini. Isi form lalu simpan untuk mulai tracking.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Modal
          isOpen={showDeleteModal}
          onClose={() => !isDeleting && setShowDeleteModal(false)}
          title="Hapus Budget"
          size="sm"
        >
          <p className="text-sm text-muted">
            Hapus budget untuk <strong className="text-ink">{formatMonthLabel(month)}</strong>? Batas
            total dan budget per kategori untuk bulan ini akan ikut terhapus.
          </p>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Hapus
            </Button>
          </ModalFooter>
        </Modal>
      </PageTransition>
    </MainLayout>
  );
}
