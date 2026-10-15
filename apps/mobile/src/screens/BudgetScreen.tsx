import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  currentBudgetMonth,
  deleteBudget,
  getBudgetStatus,
  saveBudget,
  type BudgetStatus,
} from '../lib/budget';
import { getCategories, type Category } from '../lib/finance';
import { formatIDR } from '../lib/format';
import { formatAmountInput, parseAmountInput } from '../lib/amountInput';
import { AppTextInput, PrimaryButton } from '../components/ui';
import { CategoryIcon } from '../components/CategoryIcon';
import { FadeInUp, PopIn } from '../components/motion';
import { PageLoader } from '../components/PageStatus';
import { useDialog } from '../components/AppDialog';
import { radii, type ThemeColors } from '../theme';
import { useColors } from '../themeContext';
import { useResponsive } from '../hooks/useResponsive';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Budget'>;

function parseAmount(raw: string): number {
  return parseAmountInput(raw);
}

function ProgressBar({
  percent,
  near,
  over,
  colors,
}: {
  percent: number;
  near?: boolean;
  over?: boolean;
  colors: ThemeColors;
}) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const color = over ? colors.expense : near ? colors.amber : colors.brand;
  return (
    <View style={{ height: 8, borderRadius: 999, backgroundColor: colors.track, overflow: 'hidden' }}>
      <View
        style={{
          width: `${clamped}%` as `${number}%`,
          height: '100%',
          borderRadius: 999,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export function BudgetScreen({ navigation }: Props) {
  const colors = useColors();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r), [colors, r]);
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();

  const [month] = useState(currentBudgetMonth());
  const [status, setStatus] = useState<BudgetStatus | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [totalBudget, setTotalBudget] = useState('');
  const [categoryAmounts, setCategoryAmounts] = useState<Record<string, string>>({});

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [budget, cats] = await Promise.all([
        getBudgetStatus(month),
        getCategories('EXPENSE'),
      ]);
      setStatus(budget);
      setCategories(cats);
      setTotalBudget(
        budget.hasBudget ? formatAmountInput(String(Math.round(budget.totalBudget))) : ''
      );
      const next: Record<string, string> = {};
      budget.categoryBudgets.forEach((row) => {
        next[row.categoryId] = formatAmountInput(String(Math.round(row.budgetAmount)));
      });
      setCategoryAmounts(next);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    const parsedTotal = parseAmount(totalBudget);
    if (parsedTotal <= 0) {
      showDialog({ variant: 'warning', title: 'Budget kosong', message: 'Isi total budget lebih dari 0.' });
      return;
    }
    const categoryBudgets = categories
      .map((cat) => {
        const raw = categoryAmounts[cat.id]?.trim();
        if (!raw) return null;
        const amount = parseAmount(raw);
        if (amount <= 0) return null;
        return { categoryId: cat.id, amount };
      })
      .filter(Boolean) as { categoryId: string; amount: number }[];

    setSaving(true);
    try {
      const next = await saveBudget({ month, totalBudget: parsedTotal, categoryBudgets });
      setStatus(next);
      showDialog({
        variant: 'success',
        title: 'Tersimpan',
        message: 'Budget bulan ini sudah diperbarui.',
        confirmLabel: 'Saya mengerti',
      });
    } catch {
      showDialog({ variant: 'danger', title: 'Gagal', message: 'Budget tidak bisa disimpan.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    showDialog({
      variant: 'danger',
      title: 'Hapus budget?',
      message: 'Progress tracking bulan ini akan di-reset.',
      showCancel: true,
      cancelLabel: 'Batal',
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        await deleteBudget(month);
        setTotalBudget('');
        setCategoryAmounts({});
        await load(true);
      },
    });
  };

  if (loading && !status) {
    return <PageLoader label="Memuat budget…" />;
  }

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 8),
        paddingBottom: Math.max(insets.bottom, 20) + 24,
        paddingHorizontal: r.pagePadding,
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} />
      }
    >
      <FadeInUp>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.brand} />
          </Pressable>
          <Text style={styles.title}>Budget Bulanan</Text>
        </View>
      </FadeInUp>

      {status?.hasBudget ? (
        <PopIn delay={40}>
          <View style={styles.card}>
            {(status.isNearLimit || status.isOverLimit) && (
              <View
                style={[
                  styles.alert,
                  { backgroundColor: status.isOverLimit ? colors.expenseSoft : colors.amberSoft },
                ]}
              >
                <Ionicons
                  name="warning-outline"
                  size={16}
                  color={status.isOverLimit ? colors.expense : colors.amber}
                />
                <Text
                  style={[
                    styles.alertText,
                    { color: status.isOverLimit ? colors.expense : colors.amber },
                  ]}
                >
                  {status.isOverLimit
                    ? 'Budget total sudah melewati limit!'
                    : 'Budget total sudah ≥ 80%.'}
                </Text>
              </View>
            )}
            <Text style={styles.cardLabel}>Progress total</Text>
            <Text style={styles.amountLine}>
              {formatIDR(status.totalSpent)} / {formatIDR(status.totalBudget)}
            </Text>
            <ProgressBar
              percent={status.percentUsed}
              near={status.isNearLimit}
              over={status.isOverLimit}
              colors={colors}
            />
            <Text style={styles.meta}>
              Sisa {formatIDR(status.totalRemaining)} · {status.percentUsed}% terpakai
            </Text>
          </View>
        </PopIn>
      ) : null}

      <FadeInUp delay={80}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total budget</Text>
          <AppTextInput
            value={totalBudget}
            onChangeText={(v) => setTotalBudget(formatAmountInput(v))}
            keyboardType="numeric"
            placeholder="Contoh: 5.000.000"
          />

          <Text style={[styles.cardLabel, { marginTop: 14 }]}>Limit per kategori (opsional)</Text>
          {categories.map((cat) => (
            <View key={cat.id} style={styles.catRow}>
              <CategoryIcon icon={cat.icon} color={cat.color} size={14} box={28} />
              <View style={{ flex: 1 }}>
                <Text style={styles.catName}>{cat.name}</Text>
                <AppTextInput
                  value={categoryAmounts[cat.id] ?? ''}
                  onChangeText={(v) =>
                    setCategoryAmounts((prev) => ({
                      ...prev,
                      [cat.id]: formatAmountInput(v),
                    }))
                  }
                  keyboardType="numeric"
                  placeholder="Limit"
                />
              </View>
            </View>
          ))}

          <PrimaryButton label="Simpan budget" onPress={handleSave} loading={saving} />
          {status?.hasBudget ? (
            <Pressable onPress={handleDelete} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>Hapus budget bulan ini</Text>
            </Pressable>
          ) : null}
        </View>
      </FadeInUp>

      {status?.categoryBudgets?.length ? (
        <FadeInUp delay={120}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Progress per kategori</Text>
            {status.categoryBudgets.map((row) => (
              <View key={row.categoryId} style={{ marginBottom: 12 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.catName}>{row.categoryName}</Text>
                  <Text style={styles.meta}>
                    {formatIDR(row.spent)} / {formatIDR(row.budgetAmount)}
                  </Text>
                </View>
                <ProgressBar
                  percent={row.percentUsed}
                  near={row.isNearLimit}
                  over={row.isOverLimit}
                  colors={colors}
                />
              </View>
            ))}
          </View>
        </FadeInUp>
      ) : null}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors, r: ReturnType<typeof useResponsive>) {
  return StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    title: { fontSize: r.ms(22), fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 12,
    },
    cardLabel: { fontSize: r.ms(12), fontWeight: '700', color: colors.muted, marginBottom: 8 },
    amountLine: { fontSize: r.ms(16), fontWeight: '800', color: colors.text, marginBottom: 8 },
    meta: { marginTop: 6, fontSize: r.ms(11), color: colors.faint, fontWeight: '600' },
    alert: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: radii.md,
      padding: 10,
      marginBottom: 10,
    },
    alertText: { flex: 1, fontSize: r.ms(12), fontWeight: '700' },
    catRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    catName: { fontSize: r.ms(13), fontWeight: '700', color: colors.text, marginBottom: 4 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
    deleteBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 8 },
    deleteText: { color: colors.expense, fontWeight: '700', fontSize: r.ms(13) },
  });
}
