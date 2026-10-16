/**
 * Dompet Tenang - Recurring Transactions Page
 */

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { MainLayout, PageHeader, PageTransition } from '@/components/layout';
import { Button, Card, CardContent, Input, Select, Badge } from '@/components/ui';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/lib/utils';
import { formatAmountInput, parseAmountInput } from '@/lib/amountInput';
import {
  createRecurringTransaction,
  getRecurringTransactions,
  setRecurringActive,
  type RecurringTransaction,
} from '@/services/recurring.service';
import { recurringSchema } from '@/lib/validations';

const FREQUENCY_OPTIONS = [
  { value: 'DAILY', label: 'Harian' },
  { value: 'WEEKLY', label: 'Mingguan' },
  { value: 'MONTHLY', label: 'Bulanan' },
];

export function RecurringPage() {
  const toast = useToast();
  const { data: categories = [] } = useCategories('EXPENSE');
  const [rows, setRows] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [note, setNote] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    try {
      const data = await getRecurringTransactions();
      setRows(data);
    } catch {
      toast.error('Gagal memuat transaksi berulang');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    const parsed = parseAmountInput(amount);
    const checked = recurringSchema.safeParse({
      categoryId,
      amount: parsed ?? 0,
      frequency,
      note: note.trim(),
      startDate,
    });
    if (!checked.success) {
      toast.error(checked.error.errors[0]?.message || 'Lengkapi data dengan benar');
      return;
    }
    setSaving(true);
    try {
      await createRecurringTransaction({
        categoryId: checked.data.categoryId,
        amount: checked.data.amount,
        frequency: checked.data.frequency,
        note: checked.data.note || undefined,
        startDate: checked.data.startDate,
        type: 'EXPENSE',
      });
      toast.success('Transaksi berulang ditambahkan');
      setShowForm(false);
      setAmount('');
      setNote('');
      await load();
    } catch {
      toast.error('Gagal menambahkan transaksi berulang');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: RecurringTransaction) => {
    try {
      await setRecurringActive(row.id, !row.isActive);
      await load();
    } catch {
      toast.error('Gagal mengubah status');
    }
  };

  return (
    <MainLayout>
      <PageTransition>
        <PageHeader
          eyebrow="Otomatis"
          title="Transaksi Otomatis"
          description="Atur pengeluaran rutin (langganan, cicilan, dll.) — fondasi auto-create menyusul."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowForm((v) => !v)}>
              Tambah
            </Button>
          }
        />

        {showForm ? (
          <Card className="mb-6">
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-muted">Kategori</label>
                <Select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Pilih kategori"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-muted">Jumlah</label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                  inputMode="numeric"
                  placeholder="Contoh: 150.000"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-muted">Frekuensi</label>
                <Select
                  value={frequency}
                  onChange={(e) =>
                    setFrequency(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY')
                  }
                  options={FREQUENCY_OPTIONS}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-muted">Mulai</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-muted">Catatan</label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button onClick={handleCreate} isLoading={saving}>Simpan</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="divide-y divide-line">
            {loading ? (
              <p className="py-6 text-sm text-muted">Memuat…</p>
            ) : rows.length === 0 ? (
              <p className="py-6 text-sm text-muted">Belum ada transaksi berulang.</p>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <CategoryIcon icon={row.category.icon} size={18} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">
                        {row.category.name} · {formatCurrency(row.amount)}
                      </p>
                      <p className="text-xs text-muted">
                        {row.frequency === 'DAILY'
                          ? 'Harian'
                          : row.frequency === 'WEEKLY'
                            ? 'Mingguan'
                            : 'Bulanan'}
                        · mulai {row.startDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={row.isActive ? 'success' : 'default'}>
                      {row.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(row)}>
                      {row.isActive ? 'Stop' : 'Aktifkan'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </PageTransition>
    </MainLayout>
  );
}
