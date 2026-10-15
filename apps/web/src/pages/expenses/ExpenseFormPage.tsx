/**
 * Dompet Tenang - Expense / Income Form Page
 */

import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Calculator, Save } from 'lucide-react';
import { MainLayout, PageHeader, PageTransition } from '@/components/layout';
import {
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Loading,
  AmountCalculator,
  ReceiptUpload,
  FieldTooltip,
} from '@/components/ui';
import { expenseSchema } from '@/lib/validations';
import type { ExpenseFormData } from '@/lib/validations';
import { useExpense, useExpenseMutations, useCategories } from '@/hooks';
import { formatDateForInput } from '@/lib/utils';
import { formatAmountInput, parseAmountInput } from '@/lib/amountInput';
import { ROUTES } from '@/lib/constants';
import type { TransactionType } from '@/types';

export function ExpenseFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const type: TransactionType = location.pathname.includes('/incomes')
    ? 'INCOME'
    : 'EXPENSE';
  const isIncome = type === 'INCOME';
  const listRoute = isIncome ? ROUTES.INCOMES : ROUTES.EXPENSES;
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [amountDisplay, setAmountDisplay] = useState('');

  const { data: expense, isLoading: isExpenseLoading } = useExpense(id || '', type);
  const { data: categories, isLoading: isCategoriesLoading } = useCategories(type);
  const { create: createMutation, update: updateMutation } = useExpenseMutations(type);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      // Empty by default so users don't have to clear a leading "0"
      amount: undefined,
      description: '',
      date: formatDateForInput(new Date()),
      categoryId: '',
      receiptUrl: null,
    },
  });

  const amountValue = watch('amount');
  const receiptUrl = watch('receiptUrl');

  useEffect(() => {
    if (expense) {
      reset({
        amount: expense.amount,
        description: expense.description,
        date: formatDateForInput(expense.date),
        categoryId: expense.categoryId,
        receiptUrl: expense.receiptUrl ?? null,
      });
      setAmountDisplay(formatAmountInput(String(Math.round(expense.amount))));
    }
  }, [expense, reset]);

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      const payload = {
        ...data,
        type,
        date: data.date.slice(0, 10),
        receiptUrl: data.receiptUrl || null,
      };

      if (isEditing && id) {
        await updateMutation.mutateAsync({ id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate(listRoute);
    } catch {
      // Error handled by mutation
    }
  };

  const categoryOptions =
    categories?.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })) || [];

  if (isEditing && isExpenseLoading) {
    return (
      <PageTransition>
        <MainLayout>
          <Loading
            message={isIncome ? 'Memuat data pemasukan...' : 'Memuat data pengeluaran...'}
          />
        </MainLayout>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <MainLayout>
        <PageHeader
          eyebrow="Form"
          title={
            isEditing
              ? isIncome
                ? 'Edit Pemasukan'
                : 'Edit Pengeluaran'
              : isIncome
                ? 'Tambah Pemasukan'
                : 'Tambah Pengeluaran'
          }
          description={
            isIncome
              ? 'Catat pemasukan seperti gaji, freelance, atau bonus'
              : 'Catat pengeluaran baru dengan cepat'
          }
          action={
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate(listRoute)}
              className="w-full sm:w-auto"
            >
              Kembali
            </Button>
          }
        />

        <Card className="max-w-2xl" padding="md">
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label
                    htmlFor="amount"
                    className="flex items-center gap-1.5 text-sm font-semibold text-ink"
                  >
                    <span>Jumlah (Rp)</span>
                    <FieldTooltip content="Masukkan nominal transaksi. Pakai tombol Kalkulator jika perlu menjumlah beberapa angka dulu." />
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCalculatorOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-accent/15"
                  >
                    <Calculator className="h-3.5 w-3.5" />
                    Kalkulator
                  </button>
                </div>
                <Input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: 50.000"
                  error={errors.amount?.message}
                  rightIcon={<Calculator className="h-4 w-4" />}
                  value={amountDisplay}
                  onChange={(e) => {
                    const formatted = formatAmountInput(e.target.value);
                    setAmountDisplay(formatted);
                    const parsed = parseAmountInput(formatted);
                    if (parsed > 0) {
                      setValue('amount', parsed, { shouldValidate: true, shouldDirty: true });
                    } else {
                      setValue('amount', undefined as unknown as number, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                  }}
                  onFocus={(e) => {
                    e.target.select();
                  }}
                />
              </div>

              <AmountCalculator
                isOpen={isCalculatorOpen}
                onClose={() => setIsCalculatorOpen(false)}
                initialValue={
                  typeof amountValue === 'number' && Number.isFinite(amountValue)
                    ? amountValue
                    : undefined
                }
                onApply={(amount) => {
                  setAmountDisplay(formatAmountInput(String(Math.round(amount))));
                  setValue('amount', amount, { shouldValidate: true, shouldDirty: true });
                }}
              />

              <Input
                label="Deskripsi"
                tooltip={
                  isIncome
                    ? 'Jelaskan sumber uang, misalnya gaji, freelance, atau bonus.'
                    : 'Jelaskan keperluan belanja agar mudah dicari lagi nanti.'
                }
                placeholder={
                  isIncome ? 'Contoh: Gaji bulan Agustus' : 'Contoh: Makan siang di warteg'
                }
                error={errors.description?.message}
                {...register('description')}
              />

              <Input
                label="Tanggal"
                tooltip="Tanggal terjadinya transaksi, bukan tanggal pencatatan."
                type="date"
                error={errors.date?.message}
                {...register('date')}
              />

              <Select
                label="Kategori"
                tooltip={
                  isIncome
                    ? 'Pilih kategori pemasukan agar laporan dashboard lebih akurat.'
                    : 'Pilih kategori pengeluaran untuk breakdown grafik per kategori.'
                }
                placeholder="Pilih kategori"
                options={categoryOptions}
                disabled={isCategoriesLoading}
                error={errors.categoryId?.message}
                {...register('categoryId')}
              />

              <ReceiptUpload
                value={receiptUrl}
                onChange={(url) =>
                  setValue('receiptUrl', url, { shouldDirty: true, shouldValidate: true })
                }
                error={errors.receiptUrl?.message}
                disabled={isSubmitting}
              />

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(listRoute)}
                  className="w-full sm:w-auto"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  isLoading={isSubmitting}
                  leftIcon={<Save className="h-4 w-4" />}
                  className="w-full sm:w-auto"
                >
                  {isEditing
                    ? 'Simpan Perubahan'
                    : isIncome
                      ? 'Tambah Pemasukan'
                      : 'Tambah Pengeluaran'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </MainLayout>
    </PageTransition>
  );
}
