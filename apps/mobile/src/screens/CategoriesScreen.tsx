import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  deleteCategory,
  getCategories,
  type Category,
  type TxType,
} from '../lib/finance';
import { CategoryIcon } from '../components/CategoryIcon';
import { FadeInUp, ScalePress, PopIn } from '../components/motion';
import { PageLoader } from '../components/PageStatus';
import { useDialog } from '../components/AppDialog';
import { radii, spacing, type ThemeColors } from '../theme';
import { useColors } from '../themeContext';
import { useResponsive } from '../hooks/useResponsive';
import type { MainStackParamList } from '../navigation/types';

export function CategoriesScreen() {
  const colors = useColors();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r), [colors, r]);
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [items, setItems] = useState<Category[]>([]);
  const [filter, setFilter] = useState<TxType | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await getCategories(filter === 'ALL' ? undefined : filter);
      setItems(data);
    } catch {
      setError('Gagal memuat kategori.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const counts = useMemo(() => {
    const income = items.filter((i) => i.type === 'INCOME').length;
    const expense = items.filter((i) => i.type === 'EXPENSE').length;
    return { income, expense, total: items.length };
  }, [items]);

  const onDelete = (item: Category) => {
    showDialog({
      variant: 'danger',
      title: 'Hapus kategori?',
      message: `"${item.name}" akan dihapus. Transaksi terkait mungkin terdampak.`,
      confirmLabel: 'Hapus',
      cancelLabel: 'Batal',
      showCancel: true,
      onConfirm: async () => {
        try {
          await deleteCategory(item.id);
          setItems((prev) => prev.filter((c) => c.id !== item.id));
          showDialog({
            variant: 'success',
            title: 'Kategori dihapus',
            message: 'Kategori berhasil dihapus.',
            confirmLabel: 'Saya mengerti',
          });
        } catch (e: unknown) {
          const message =
            (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Tidak bisa menghapus kategori.';
          showDialog({ variant: 'error', title: 'Gagal menghapus', message });
        }
      },
    });
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <FadeInUp>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons name="pricetags" size={20} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Kategori</Text>
              <Text style={styles.heroSub}>Kelola label pemasukan & pengeluaran</Text>
            </View>
            <ScalePress
              style={styles.addFab}
              onPress={() => navigation.navigate('CategoryForm')}
            >
              <Ionicons name="add" size={22} color={colors.onBrand} />
            </ScalePress>
          </View>

          <View style={styles.statRow}>
            {filter === 'ALL' ? (
              <>
                <View style={styles.statPill}>
                  <Text style={styles.statValue}>{counts.total}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={[styles.statPill, styles.statIncome]}>
                  <Text style={[styles.statValue, { color: colors.income }]}>{counts.income}</Text>
                  <Text style={styles.statLabel}>Masuk</Text>
                </View>
                <View style={[styles.statPill, styles.statExpense]}>
                  <Text style={[styles.statValue, { color: colors.expense }]}>
                    {counts.expense}
                  </Text>
                  <Text style={styles.statLabel}>Keluar</Text>
                </View>
              </>
            ) : (
              <View style={[styles.statPill, { flex: 1 }]}>
                <Text style={styles.statValue}>{items.length}</Text>
                <Text style={styles.statLabel}>Ditampilkan</Text>
              </View>
            )}
          </View>
        </View>
      </FadeInUp>

      <PopIn delay={40}>
        <View style={styles.segment}>
          {(
            [
              ['ALL', 'Semua', 'apps-outline'],
              ['EXPENSE', 'Keluar', 'arrow-up-circle-outline'],
              ['INCOME', 'Masuk', 'arrow-down-circle-outline'],
            ] as const
          ).map(([key, label, icon]) => {
            const active = filter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                style={[styles.segItem, active && styles.segItemActive]}
              >
                <Ionicons
                  name={icon}
                  size={14}
                  color={active ? colors.onBrand : colors.muted}
                />
                <Text style={[styles.segText, active && styles.segTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </PopIn>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && items.length === 0 ? (
        <PageLoader label="Memuat kategori…" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 28, flexGrow: 1, paddingTop: 4 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load(true);
              }}
              tintColor={colors.brand}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="folder-open-outline" size={32} color={colors.brand} />
              </View>
              <Text style={styles.emptyTitle}>Belum ada kategori</Text>
              <Text style={styles.emptyBody}>
                Buat kategori supaya pencatatan lebih rapi dan mudah dibaca.
              </Text>
              <ScalePress
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('CategoryForm')}
              >
                <Text style={styles.emptyBtnText}>+ Tambah kategori</Text>
              </ScalePress>
            </View>
          }
          renderItem={({ item }) => {
            const isIncome = item.type === 'INCOME';
            const tint = item.color || colors.brand;
            return (
              <ScalePress
                style={[styles.row, { borderLeftColor: tint }]}
                onPress={() => navigation.navigate('CategoryForm', { id: item.id })}
                onLongPress={() => onDelete(item)}
              >
                <CategoryIcon icon={item.icon} color={tint} size={20} box={44} />
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor: isIncome ? colors.incomeSoft : colors.expenseSoft,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isIncome ? 'arrow-down' : 'arrow-up'}
                      size={11}
                      color={isIncome ? colors.income : colors.expense}
                    />
                    <Text
                      style={[
                        styles.typeBadgeText,
                        { color: isIncome ? colors.income : colors.expense },
                      ]}
                    >
                      {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                    </Text>
                  </View>
                </View>
                <View style={styles.rowAction}>
                  <Ionicons name="chevron-forward" size={18} color={colors.faint} />
                </View>
              </ScalePress>
            );
          }}
        />
      )}
      <Text style={styles.footerHint}>Tap untuk edit · Tahan untuk hapus</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors, r: ReturnType<typeof useResponsive>) {
  return StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: r.pagePadding, paddingTop: 10 },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brandSoftBorder,
  },
  heroTitle: { fontSize: r.ms(20), fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  heroSub: { marginTop: 2, color: colors.muted, fontSize: r.ms(12), fontWeight: '600' },
  addFab: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  statPill: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIncome: { backgroundColor: colors.incomeSoft, borderColor: colors.incomeBorder },
  statExpense: { backgroundColor: colors.expenseSoft, borderColor: colors.expenseBorder },
  statValue: { fontWeight: '900', fontSize: r.ms(16), color: colors.text },
  statLabel: { marginTop: 2, fontSize: r.ms(10), fontWeight: '700', color: colors.muted },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: 10,
    gap: 4,
  },
  segItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: radii.md,
  },
  segItemActive: { backgroundColor: colors.brand },
  segText: { fontWeight: '700', fontSize: r.ms(12), color: colors.muted },
  segTextActive: { color: colors.onBrand },
  empty: { marginTop: 40, paddingHorizontal: 16, alignItems: 'center' },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontWeight: '800', fontSize: r.ms(16), color: colors.text },
  emptyBody: {
    marginTop: 8,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: r.ms(13),
  },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: colors.brand,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyBtnText: { color: colors.onBrand, fontWeight: '800' },
  error: {
    backgroundColor: colors.dangerBg,
    color: colors.dangerText,
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 12,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontWeight: '800', color: colors.text, fontSize: r.ms(15) },
  typeBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  typeBadgeText: { fontSize: r.ms(11), fontWeight: '800' },
  rowAction: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerHint: {
    textAlign: 'center',
    color: colors.faint,
    fontSize: r.ms(11),
    fontWeight: '600',
    paddingVertical: 8,
  },
});
}
