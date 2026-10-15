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
  createRecurringTransaction,
  getRecurringTransactions,
  setRecurringActive,
  type RecurringTransaction,
} from '../lib/recurring';
import { getCategories, type Category } from '../lib/finance';
import { formatIDR, todayISO } from '../lib/format';
import { formatAmountInput, parseAmountInput } from '../lib/amountInput';
import { AppTextInput, PrimaryButton } from '../components/ui';
import { CategoryIcon } from '../components/CategoryIcon';
import { FadeInUp, ScalePress } from '../components/motion';
import { PageLoader } from '../components/PageStatus';
import { useDialog } from '../components/AppDialog';
import { radii, type ThemeColors } from '../theme';
import { useColors } from '../themeContext';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../authContext';
import { hasProAccess } from '../lib/plan';
import { ProFeatureLock } from '../components/ProFeatureLock';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Recurring'>;

const FREQUENCIES = [
  { id: 'DAILY' as const, label: 'Harian' },
  { id: 'WEEKLY' as const, label: 'Mingguan' },
  { id: 'MONTHLY' as const, label: 'Bulanan' },
];

function parseAmount(raw: string): number {
  return parseAmountInput(raw);
}

export function RecurringScreen({ navigation }: Props) {
  const colors = useColors();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r), [colors, r]);
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const { user } = useAuth();
  const isPro = hasProAccess(user);

  const [rows, setRows] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [note, setNote] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!isPro) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const [list, cats] = await Promise.all([
        getRecurringTransactions(),
        getCategories('EXPENSE'),
      ]);
      setRows(list);
      setCategories(cats);
      if (cats[0]) setCategoryId((prev) => prev || cats[0].id);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isPro]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isPro) {
    return (
      <ProFeatureLock
        title="Transaksi Otomatis"
        message="Fitur Pro Lifetime. Jadwalkan pemasukan/pengeluaran rutin setelah upgrade."
      />
    );
  }

  const handleSave = async () => {
    const parsed = parseAmount(amount);
    if (!categoryId || parsed <= 0) {
      showDialog({ variant: 'warning', title: 'Data belum lengkap', message: 'Isi kategori dan jumlah.' });
      return;
    }
    setSaving(true);
    try {
      await createRecurringTransaction({
        categoryId,
        amount: parsed,
        frequency,
        startDate: todayISO(),
        note: note.trim() || undefined,
        type: 'EXPENSE',
      });
      setShowForm(false);
      setAmount('');
      setNote('');
      await load(true);
    } catch {
      showDialog({ variant: 'danger', title: 'Gagal', message: 'Tidak bisa menyimpan transaksi berulang.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading && rows.length === 0) {
    return <PageLoader label="Memuat transaksi berulang…" />;
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
          <Text style={styles.title}>Transaksi Berulang</Text>
          <Pressable onPress={() => setShowForm((v) => !v)} hitSlop={8}>
            <Ionicons name={showForm ? 'close' : 'add'} size={22} color={colors.brand} />
          </Pressable>
        </View>
      </FadeInUp>

      {showForm ? (
        <FadeInUp delay={40}>
          <View style={styles.card}>
            <Text style={styles.label}>Kategori</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setCategoryId(cat.id)}
                  style={[
                    styles.chip,
                    categoryId === cat.id && styles.chipActive,
                  ]}
                >
                  <CategoryIcon icon={cat.icon} color={cat.color} size={12} box={22} />
                  <Text style={[styles.chipText, categoryId === cat.id && styles.chipTextActive]}>
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.label}>Jumlah</Text>
            <AppTextInput
              value={amount}
              onChangeText={(v) => setAmount(formatAmountInput(v))}
              keyboardType="numeric"
              placeholder="150.000"
            />
            <Text style={styles.label}>Frekuensi</Text>
            <View style={styles.freqRow}>
              {FREQUENCIES.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => setFrequency(f.id)}
                  style={[styles.freqBtn, frequency === f.id && styles.freqBtnActive]}
                >
                  <Text style={[styles.freqText, frequency === f.id && styles.freqTextActive]}>{f.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Catatan</Text>
            <AppTextInput value={note} onChangeText={setNote} placeholder="Opsional" />
            <PrimaryButton label="Simpan" onPress={handleSave} loading={saving} />
          </View>
        </FadeInUp>
      ) : null}

      {rows.map((row, i) => (
        <FadeInUp key={row.id} delay={60 + i * 40}>
          <ScalePress style={styles.rowCard}>
            <CategoryIcon icon={row.category.icon} color={row.category.color} size={14} box={32} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {row.category.name} · {formatIDR(Number(row.amount))}
              </Text>
              <Text style={styles.rowMeta}>
                {row.frequency === 'DAILY' ? 'Harian' : row.frequency === 'WEEKLY' ? 'Mingguan' : 'Bulanan'}
                · {row.isActive ? 'Aktif' : 'Nonaktif'}
              </Text>
            </View>
            <Pressable onPress={() => void setRecurringActive(row.id, !row.isActive).then(() => load(true))}>
              <Text style={styles.toggle}>{row.isActive ? 'Stop' : 'Aktif'}</Text>
            </Pressable>
          </ScalePress>
        </FadeInUp>
      ))}

      {rows.length === 0 && !showForm ? (
        <Text style={styles.empty}>Belum ada transaksi berulang.</Text>
      ) : null}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors, r: ReturnType<typeof useResponsive>) {
  return StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    title: { fontSize: r.ms(20), fontWeight: '800', color: colors.text },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 12,
    },
    label: { fontSize: r.ms(12), fontWeight: '700', color: colors.muted, marginBottom: 6, marginTop: 4 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
    },
    chipActive: { backgroundColor: colors.brandSoft, borderColor: colors.brandSoftBorder },
    chipText: { fontSize: r.ms(12), fontWeight: '700', color: colors.muted },
    chipTextActive: { color: colors.brandDark },
    freqRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    freqBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    freqBtnActive: { backgroundColor: colors.brand, borderColor: colors.brand },
    freqText: { fontSize: r.ms(12), fontWeight: '700', color: colors.muted },
    freqTextActive: { color: colors.onBrand },
    rowCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 8,
    },
    rowTitle: { fontSize: r.ms(14), fontWeight: '800', color: colors.text },
    rowMeta: { fontSize: r.ms(11), color: colors.muted, marginTop: 2 },
    toggle: { fontSize: r.ms(12), fontWeight: '800', color: colors.brand },
    empty: { textAlign: 'center', color: colors.muted, marginTop: 24, fontWeight: '600' },
  });
}
