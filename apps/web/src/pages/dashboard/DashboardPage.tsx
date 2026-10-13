/**
 * Dompet Tenang - Dashboard Page
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Scale,
  Plus,
  ArrowRight,
  Activity,
  PieChart as PieChartIcon,
  FileSpreadsheet,
  FileText,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { MainLayout, PageHeader, PageTransition } from '@/components/layout';
import {
  Button,
  Loading,
  EmptyState,
  Card,
  CardHeader,
  CardTitle,
  CategoryIcon,
  Modal,
} from '@/components/ui';
import { useDashboard, useExpenses, useFeatureEnabled } from '@/hooks';
import { useToast } from '@/hooks/useToast';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { consumeWelcomePending, WELCOME_COPY } from '@/lib/welcome';
import { useAuthStore } from '@/stores';
import { SEO } from '@/components/SEO';
import { runRecurringDue } from '@/services/recurring.service';
import type { CategoryBreakdown } from '@/types';
import { DashboardInsights } from './components/DashboardInsights';
import { CollapsibleSection } from './components/CollapsibleSection';
import { MarketRates } from './components/MarketRates';
import { BudgetSummaryCard } from './components/BudgetSummaryCard';
import { fetchAllTransactionsForRange } from '@/lib/fetchTransactions';
import { exportReportToExcel, exportReportToPdf } from '@/lib/exportReport';

type Period = 'week' | 'month' | 'year';
type ExportFormat = 'excel' | 'pdf';

const DASHBOARD_AMOUNTS_VISIBLE_KEY = 'dompettenang_dashboard_amounts_visible';
const HIDDEN_AMOUNT = '••••••';

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #d7e0ea',
  boxShadow: '0 10px 30px rgba(7,17,31,0.08)',
  fontSize: '12px',
};

function CategorySummaryPanel({
  title,
  icon: Icon,
  iconClass,
  items,
  total,
  emptyTitle,
  emptyDescription,
  amountTone,
  amountsVisible,
}: {
  title: string;
  icon: typeof PieChartIcon;
  iconClass: string;
  items: CategoryBreakdown[];
  total: number;
  emptyTitle: string;
  emptyDescription: string;
  amountTone: string;
  amountsVisible: boolean;
}) {
  const showAmount = (n: number) => (amountsVisible ? formatCurrency(n) : HIDDEN_AMOUNT);

  if (!items.length) {
    return (
      <Card padding="md" className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className={cn('h-5 w-5', iconClass)} />
            {title}
          </CardTitle>
        </CardHeader>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </Card>
    );
  }

  return (
    <Card padding="md" className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={cn('h-5 w-5', iconClass)} />
          {title}
        </CardTitle>
        <span className={cn('text-sm font-bold tabular', amountTone)}>
          {showAmount(total)}
        </span>
      </CardHeader>

      <div className="grid gap-4 sm:grid-cols-[1fr_1.1fr] sm:items-center">
        <div className="h-52 sm:h-60">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={items}
                dataKey="total"
                nameKey="categoryName"
                cx="50%"
                cy="50%"
                outerRadius="80%"
                innerRadius="52%"
                paddingAngle={3}
              >
                {items.map((entry, index) => (
                  <Cell
                    key={entry.categoryId}
                    fill={entry.categoryColor || `hsl(${160 + index * 28}, 55%, 45%)`}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) =>
                  amountsVisible ? formatCurrency(Number(value)) : HIDDEN_AMOUNT
                }
                contentStyle={tooltipStyle}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {items.map((item) => (
            <div key={item.categoryId} className="rounded-xl bg-mist/70 px-3 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: item.categoryColor
                        ? `${item.categoryColor}22`
                        : '#e6edf4',
                      color: item.categoryColor || '#0f9b8e',
                    }}
                  >
                    <CategoryIcon icon={item.categoryIcon} size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {item.categoryName}
                    </p>
                    <p className="text-xs text-muted">
                      {item.count} transaksi · {item.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <p className={cn('flex-shrink-0 text-sm font-bold tabular', amountTone)}>
                  {showAmount(item.total)}
                </p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line/70">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(item.percentage, 100)}%`,
                    backgroundColor: item.categoryColor || '#0f9b8e',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const showMarket = useFeatureEnabled('market_widget');
  const showRecurring = useFeatureEnabled('recurring_transactions');
  const [period, setPeriod] = useState<Period>('month');
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);
  const [amountsVisible, setAmountsVisible] = useState(() => {
    try {
      const stored = localStorage.getItem(DASHBOARD_AMOUNTS_VISIBLE_KEY);
      if (stored === null) return true;
      return stored === '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(DASHBOARD_AMOUNTS_VISIBLE_KEY, amountsVisible ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [amountsVisible]);

  useEffect(() => {
    if (!user) return;
    if (consumeWelcomePending(user.id)) {
      setWelcomeOpen(true);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user || !showRecurring) return;
    void (async () => {
      try {
        await runRecurringDue();
      } catch {
        /* ignore: dashboard should still load */
      }
    })();
  }, [user, showRecurring]);

  const showAmount = (n: number) => (amountsVisible ? formatCurrency(n) : HIDDEN_AMOUNT);

  const toggleAmountsVisible = () => setAmountsVisible((v) => !v);

  const { data: summary, isLoading: isSummaryLoading } = useDashboard({ period });
  const { data: recentExpenses, isLoading: isExpensesLoading } = useExpenses({
    limit: 5,
    type: 'EXPENSE',
    sortBy: 'date',
    sortOrder: 'desc',
  });
  const { data: recentIncomes, isLoading: isIncomesLoading } = useExpenses({
    limit: 5,
    type: 'INCOME',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const periodLabels: Record<Period, string> = {
    week: 'Minggu',
    month: 'Bulan',
    year: 'Tahun',
  };

  const handleExport = async (format: ExportFormat) => {
    if (!summary) {
      toast.error('Data ringkasan belum siap');
      return;
    }

    setIsExporting(format);
    try {
      const transactions = await fetchAllTransactionsForRange(
        summary.periodStart,
        summary.periodEnd
      );

      const payload = {
        summary,
        transactions,
        periodLabel: periodLabels[period],
      };

      if (format === 'excel') {
        exportReportToExcel(payload);
        toast.success('Laporan Excel berhasil diunduh');
      } else {
        exportReportToPdf(payload);
        toast.success('Laporan PDF berhasil diunduh');
      }
    } catch {
      toast.error('Gagal mengekspor laporan. Coba lagi.');
    } finally {
      setIsExporting(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  const expenseBreakdown =
    summary?.expenseCategoryBreakdown || summary?.categoryBreakdown || [];
  const incomeBreakdown = summary?.incomeCategoryBreakdown || [];
  const overview = summary?.overview || [];

  const stats = [
    {
      key: 'income',
      label: 'Pemasukan',
      value: showAmount(summary?.totalIncome || 0),
      hint: `${summary?.incomeCount || 0} transaksi`,
      icon: TrendingUp,
      tone: 'text-lime bg-lime-soft',
    },
    {
      key: 'expense',
      label: 'Pengeluaran',
      value: showAmount(summary?.totalExpenses || 0),
      hint: `${summary?.expenseCount || 0} transaksi`,
      icon: TrendingDown,
      tone: 'text-coral bg-coral-soft',
    },
    {
      key: 'balance',
      label: 'Saldo Bersih',
      value: showAmount(summary?.balance || 0),
      hint: (summary?.balance || 0) >= 0 ? 'Surplus' : 'Defisit',
      icon: Scale,
      tone:
        (summary?.balance || 0) >= 0
          ? 'text-accent bg-accent-soft'
          : 'text-coral bg-coral-soft',
    },
    {
      key: 'wallet',
      label: 'Ringkasan',
      value: periodLabels[period],
      hint: `${summary?.periodStart || '-'} → ${summary?.periodEnd || '-'}`,
      icon: Wallet,
      tone: 'text-ink bg-mist-deep',
    },
  ];

  return (
    <PageTransition>
      <SEO title="Dashboard" description="Ringkasan keuangan pribadimu — pemasukan, pengeluaran, dan analisis." noIndex />
      <MainLayout>
        <Modal
          isOpen={welcomeOpen}
          onClose={() => setWelcomeOpen(false)}
          title={WELCOME_COPY.title}
          size="sm"
          showBrand
        >
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="text-sm leading-relaxed text-muted">
              {user?.name ? (
                <>
                  Halo <span className="font-semibold text-ink">{user.name.split(' ')[0]}</span>!{' '}
                </>
              ) : null}
              {WELCOME_COPY.message}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="gradient"
                className="w-full"
                onClick={() => {
                  setWelcomeOpen(false);
                  navigate(ROUTES.EXPENSE_NEW);
                }}
              >
                {WELCOME_COPY.confirmLabel}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setWelcomeOpen(false)}
              >
                Nanti saja
              </Button>
            </div>
          </div>
        </Modal>

        <PageHeader
          eyebrow={new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
          title={`${getGreeting()}, ${user?.name?.split(' ')[0] || 'User'}`}
          description="Pantau pemasukan, pengeluaran, dan saldo bersih dalam satu tampilan."
          action={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Link to={ROUTES.INCOME_NEW} className="w-full sm:w-auto">
                <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} className="w-full">
                  Pemasukan
                </Button>
              </Link>
              <Link to={ROUTES.EXPENSE_NEW} className="w-full sm:w-auto">
                <Button
                  variant="gradient"
                  leftIcon={<Plus className="h-4 w-4" />}
                  className="w-full"
                >
                  Pengeluaran
                </Button>
              </Link>
            </div>
          }
        />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {(['week', 'month', 'year'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition',
                  period === p
                    ? 'bg-accent text-white shadow-md shadow-accent/25'
                    : 'bg-surface text-muted ring-1 ring-line hover:text-ink hover:bg-mist'
                )}
              >
                {periodLabels[p]}
              </button>
            ))}
            <button
              type="button"
              onClick={toggleAmountsVisible}
              className="inline-flex items-center gap-1.5 rounded-xl bg-surface px-3 py-2 text-sm font-semibold text-muted ring-1 ring-line transition hover:bg-mist hover:text-ink"
              aria-label={
                amountsVisible ? 'Sembunyikan nominal' : 'Tampilkan nominal'
              }
              title={
                amountsVisible
                  ? 'Sembunyikan nominal (angka diganti ••••••)'
                  : 'Tampilkan nominal'
              }
            >
              {amountsVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span>
                {amountsVisible ? 'Sembunyikan nominal' : 'Tampilkan nominal'}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<FileSpreadsheet className="h-4 w-4" />}
              isLoading={isExporting === 'excel'}
              disabled={!summary || !!isExporting}
              onClick={() => handleExport('excel')}
            >
              Export Excel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<FileText className="h-4 w-4" />}
              isLoading={isExporting === 'pdf'}
              disabled={!summary || !!isExporting}
              onClick={() => handleExport('pdf')}
            >
              Export PDF
            </Button>
          </div>
        </div>

        {isSummaryLoading ? (
          <Loading message="Memuat data..." />
        ) : (
          <>
            <div className="mb-5 grid grid-cols-2 gap-2.5 sm:mb-6 sm:gap-3 xl:grid-cols-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card padding="sm" className="h-full sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-muted sm:text-sm">{stat.label}</p>
                      <div className={cn('rounded-xl p-2 sm:rounded-2xl sm:p-3', stat.tone)}>
                        <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                    </div>
                    <p className="mt-2 break-words font-display text-base font-bold leading-snug tabular text-ink sm:text-xl lg:text-2xl">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-[11px] text-muted sm:text-xs">{stat.hint}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            <BudgetSummaryCard />

            {showMarket && <MarketRates />}

            <CollapsibleSection
              title="Ringkasan Pemasukan & Pengeluaran"
              defaultOpen
              icon={
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <PieChartIcon className="h-4 w-4" />
                </span>
              }
              headerExtra={
                <p className="mt-0.5 text-xs font-medium text-muted">
                  Breakdown kategori beserta nominal periode ini
                </p>
              }
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <CategorySummaryPanel
                  title="Ringkasan Pengeluaran"
                  icon={TrendingDown}
                  iconClass="text-coral"
                  items={expenseBreakdown}
                  total={summary?.totalExpenses || 0}
                  emptyTitle="Belum ada pengeluaran"
                  emptyDescription="Tambahkan pengeluaran untuk melihat breakdown kategori"
                  amountTone="text-coral"
                  amountsVisible={amountsVisible}
                />
                <CategorySummaryPanel
                  title="Ringkasan Pemasukan"
                  icon={TrendingUp}
                  iconClass="text-lime"
                  items={incomeBreakdown}
                  total={summary?.totalIncome || 0}
                  emptyTitle="Belum ada pemasukan"
                  emptyDescription="Tambahkan pemasukan untuk melihat breakdown kategori"
                  amountTone="text-lime"
                  amountsVisible={amountsVisible}
                />
              </div>
            </CollapsibleSection>

            {amountsVisible ? <DashboardInsights summary={summary} /> : null}

            <Card padding="md" className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-accent" />
                  Perbandingan Pemasukan & Pengeluaran
                </CardTitle>
              </CardHeader>
              {overview.length > 0 ? (
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overview} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d7e0ea" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#5b6b7c' }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#5b6b7c' }}
                        tickLine={false}
                        axisLine={false}
                        width={56}
                        tickFormatter={(v) =>
                          amountsVisible
                            ? v >= 1_000_000
                              ? `${(v / 1_000_000).toFixed(1)}jt`
                              : v >= 1_000
                                ? `${Math.round(v / 1_000)}rb`
                                : String(v)
                            : '••'
                        }
                      />
                      <Tooltip
                        formatter={(value) =>
                          amountsVisible ? formatCurrency(Number(value)) : HIDDEN_AMOUNT
                        }
                        contentStyle={tooltipStyle}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 12 }}
                        formatter={(value) =>
                          value === 'income' ? 'Pemasukan' : 'Pengeluaran'
                        }
                      />
                      <Bar dataKey="income" fill="#7CB518" radius={[6, 6, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="expense" fill="#E85D4C" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  title="Belum ada data grafik"
                  description="Catat pemasukan atau pengeluaran untuk melihat tren periode ini"
                />
              )}
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card padding="md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-lime" />
                    Pemasukan Terbaru
                  </CardTitle>
                  <Link
                    to={ROUTES.INCOMES}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
                  >
                    Semua
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardHeader>
                {isIncomesLoading ? (
                  <Loading />
                ) : recentIncomes?.data && recentIncomes.data.length > 0 ? (
                  <div className="space-y-2">
                    {recentIncomes.data.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-2xl px-2 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
                            style={{
                              backgroundColor: item.category?.color
                                ? `${item.category.color}22`
                                : '#d9f5f1',
                              color: item.category?.color || '#0f9b8e',
                            }}
                          >
                            <CategoryIcon icon={item.category?.icon} size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink">
                              {item.description}
                            </p>
                            <p className="truncate text-sm text-muted">
                              {item.category?.name} • {formatDate(item.date)}
                            </p>
                          </div>
                        </div>
                        <p className="flex-shrink-0 text-sm font-bold font-mono text-lime">
                          +{showAmount(item.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Belum ada pemasukan"
                    description="Tambahkan pemasukan pertamamu"
                    action={
                      <Link to={ROUTES.INCOME_NEW}>
                        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                          Tambah
                        </Button>
                      </Link>
                    }
                  />
                )}
              </Card>

              <Card padding="md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-coral" />
                    Pengeluaran Terbaru
                  </CardTitle>
                  <Link
                    to={ROUTES.EXPENSES}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
                  >
                    Semua
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardHeader>
                {isExpensesLoading ? (
                  <Loading />
                ) : recentExpenses?.data && recentExpenses.data.length > 0 ? (
                  <div className="space-y-2">
                    {recentExpenses.data.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between gap-3 rounded-2xl px-2 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
                            style={{
                              backgroundColor: expense.category?.color
                                ? `${expense.category.color}22`
                                : '#e6edf4',
                              color: expense.category?.color || '#0f9b8e',
                            }}
                          >
                            <CategoryIcon icon={expense.category?.icon} size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink">
                              {expense.description}
                            </p>
                            <p className="truncate text-sm text-muted">
                              {expense.category?.name} • {formatDate(expense.date)}
                            </p>
                          </div>
                        </div>
                        <p className="flex-shrink-0 text-sm font-bold amount-negative">
                          -{showAmount(expense.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Belum ada pengeluaran"
                    description="Tambahkan pengeluaran pertamamu"
                    action={
                      <Link to={ROUTES.EXPENSE_NEW}>
                        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                          Tambah
                        </Button>
                      </Link>
                    }
                  />
                )}
              </Card>
            </div>
          </>
        )}
      </MainLayout>
    </PageTransition>
  );
}
