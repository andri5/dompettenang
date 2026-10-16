import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getTransactions,
  deleteTransaction,
  getCategories,
  type Category,
  type Transaction,
  type TxType,
} from '../lib/finance';
import { formatIDR, formatDateShort, todayISO } from '../lib/format';
import { CategoryIcon } from '../components/CategoryIcon';
import { FadeInUp, ScalePress, PopIn } from '../components/motion';
import { PageLoader } from '../components/PageStatus';
import { useDialog } from '../components/AppDialog';
import { radii, spacing, type ThemeColors } from '../theme';
import { useColors } from '../themeContext';
import { useResponsive } from '../hooks/useResponsive';
import type { MainStackParamList } from '../navigation/types';

const PAGE_SIZE = 20;

type DatePreset = 'all' | '7' | '30';

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function TransactionsScreen() {
  const colors = useColors();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r), [colors, r]);
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [items, setItems] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<TxType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<DatePreset>('all');
  const [draftCategory, setDraftCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    void (async () => {
      try {
        setCategories(await getCategories());
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const filteredCategories = useMemo(() => {
    if (filter === 'ALL') return categories;
    return categories.filter((c) => c.type === filter);
  }, [categories, filter]);

  const dateRange = useMemo(() => {
    if (datePreset === 'all') return { startDate: undefined, endDate: undefined };
    const days = datePreset === '7' ? 7 : 30;
    return { startDate: daysAgoISO(days), endDate: todayISO() };
  }, [datePreset]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) || null,
    [categories, categoryId]
  );

  const filterCount = (datePreset !== 'all' ? 1 : 0) + (categoryId ? 1 : 0);

  const dateLabel =
    datePreset === '7' ? '7 hari' : datePreset === '30' ? '30 hari' : 'Semua tanggal';

  const load = useCallback(
    async (opts?: { page?: number; append?: boolean; silent?: boolean }) => {
      const nextPage = opts?.page ?? 1;
      const append = opts?.append ?? false;
      if (!opts?.silent && !append) setLoading(true);
      if (append) setLoadingMore(true);
      setError(null);
      try {
        const result = await getTransactions({
          page: nextPage,
          limit: PAGE_SIZE,
          type: filter === 'ALL' ? undefined : filter,
          search: debouncedSearch || undefined,
          categoryId: categoryId || undefined,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
        setItems((prev) => (append ? [...prev, ...result.items] : result.items));
        setPage(result.page);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch {
        setError('Gagal memuat transaksi.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [filter, debouncedSearch, categoryId, dateRange]
  );

  useFocusEffect(
    useCallback(() => {
      void load({ page: 1 });
    }, [load])
  );

  const openFilters = () => {
    setDraftDate(datePreset);
    setDraftCategory(categoryId);
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setDatePreset(draftDate);
    setCategoryId(draftCategory);
    setFilterOpen(false);
  };

  const resetFilters = () => {
    setDraftDate('all');
    setDraftCategory(null);
  };

  const clearAllFilters = () => {
    setDatePreset('all');
    setCategoryId(null);
  };

  const onDelete = (item: Transaction) => {
    showDialog({
      variant: 'danger',
      title: 'Hapus transaksi?',
      message: item.description || item.category.name || 'Transaksi ini akan dihapus permanen.',
      confirmLabel: 'Hapus',
      cancelLabel: 'Batal',
      showCancel: true,
      onConfirm: async () => {
        try {
          await deleteTransaction(item.id);
          setItems((prev) => prev.filter((t) => t.id !== item.id));
          setTotal((t) => Math.max(0, t - 1));
          showDialog({
            variant: 'success',
            title: 'Berhasil dihapus',
            message: 'Transaksi sudah dihapus dari catatanmu.',
            confirmLabel: 'Saya mengerti',
          });
        } catch {
          showDialog({
            variant: 'error',
            title: 'Gagal menghapus',
            message: 'Tidak bisa menghapus transaksi. Coba lagi.',
          });
        }
      },
    });
  };

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 10) + 8 }]}>
      <FadeInUp>
        <View style={styles.topBar}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.kicker}>Dompet Tenang</Text>
            <Text style={styles.title}>Transaksi</Text>
            <Text style={styles.sub}>{total > 0 ? `${total} hasil` : 'Pemasukan & pengeluaran'}</Text>
          </View>
          <ScalePress
            style={styles.addBtn}
            onPress={() => navigation.navigate('TransactionForm', undefined)}
          >
            <Ionicons name="add" size={22} color={colors.onBrand} />
          </ScalePress>
        </View>
      </FadeInUp>

      <FadeInUp delay={50}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color={colors.faint} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari…"
              placeholderTextColor={colors.faint}
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.faint} />
              </Pressable>
            ) : null}
          </View>
          <ScalePress
            style={[styles.filterTrigger, filterCount > 0 && styles.filterTriggerActive]}
            onPress={openFilters}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={filterCount > 0 ? colors.onBrand : colors.brand}
            />
            {filterCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{filterCount}</Text>
              </View>
            ) : null}
          </ScalePress>
        </View>
      </FadeInUp>

      <PopIn delay={90}>
        <View style={styles.segment}>
          {(
            [
              ['ALL', 'Semua'],
              ['INCOME', 'Masuk'],
              ['EXPENSE', 'Keluar'],
            ] as const
          ).map(([key, label]) => {
            const active = filter === key;
            return (
              <Pressable
                key={key}
                style={[styles.segmentItem, active && styles.segmentItemActive]}
                onPress={() => {
                  setFilter(key);
                  setCategoryId(null);
                }}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </PopIn>

      {filterCount > 0 ? (
        <FadeInUp delay={110}>
          <View style={styles.activeFilters}>
            {datePreset !== 'all' ? (
              <View style={styles.pill}>
                <Ionicons name="calendar-outline" size={12} color={colors.brand} />
                <Text style={styles.pillText}>{dateLabel}</Text>
                <Pressable onPress={() => setDatePreset('all')} hitSlop={6}>
                  <Ionicons name="close" size={12} color={colors.muted} />
                </Pressable>
              </View>
            ) : null}
            {activeCategory ? (
              <View style={styles.pill}>
                <CategoryIcon
                  icon={activeCategory.icon}
                  color={activeCategory.color}
                  size={11}
                  box={20}
                />
                <Text style={styles.pillText} numberOfLines={1}>
                  {activeCategory.name}
                </Text>
                <Pressable onPress={() => setCategoryId(null)} hitSlop={6}>
                  <Ionicons name="close" size={12} color={colors.muted} />
                </Pressable>
              </View>
            ) : null}
            <Pressable onPress={clearAllFilters}>
              <Text style={styles.clearAll}>Reset</Text>
            </Pressable>
          </View>
        </FadeInUp>
      ) : (
        <Text style={styles.hint}>Tap edit · Tahan hapus</Text>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && items.length === 0 ? (
        <PageLoader label="Memuat transaksi…" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load({ page: 1, silent: true });
              }}
              tintColor={colors.brand}
            />
          }
          onEndReached={() => {
            if (loadingMore || loading || page >= totalPages) return;
            void load({ page: page + 1, append: true });
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.brand} style={{ marginVertical: 12 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={40} color={colors.faint} />
              <Text style={styles.emptyTitle}>Belum ada transaksi</Text>
              <Text style={styles.emptyBody}>Ubah filter atau tap + untuk menambah.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isIncome = item.type === 'INCOME';
            return (
              <ScalePress
                style={styles.row}
                onPress={() => navigation.navigate('TransactionForm', { id: item.id })}
                onLongPress={() => onDelete(item)}
              >
                <CategoryIcon
                  icon={item.category.icon}
                  color={item.category.color}
                  size={16}
                  box={34}
                />
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.description || item.category.name || 'Transaksi'}
                  </Text>
                  <View style={styles.rowMetaRow}>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {item.category.name || '—'} · {formatDateShort(item.date)}
                    </Text>
                    {item.receiptUrl ? (
                      <View style={styles.receiptBadge}>
                        <Ionicons name="attach" size={11} color={colors.brand} />
                        <Text style={styles.receiptBadgeText}>Struk</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <Text
                  style={[
                    styles.rowAmount,
                    { color: isIncome ? colors.income : colors.expense },
                  ]}
                >
                  {isIncome ? '+' : '−'}
                  {formatIDR(item.amount)}
                </Text>
              </ScalePress>
            );
          }}
        />
      )}

      <Modal
        visible={filterOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setFilterOpen(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filter</Text>
              <Pressable onPress={resetFilters}>
                <Text style={styles.sheetReset}>Reset</Text>
              </Pressable>
            </View>

            <Text style={styles.sheetLabel}>Periode</Text>
            <View style={styles.optionRow}>
              {(
                [
                  ['all', 'Semua'],
                  ['7', '7 hari'],
                  ['30', '30 hari'],
                ] as const
              ).map(([key, label]) => {
                const active = draftDate === key;
                return (
                  <Pressable
                    key={key}
                    style={[styles.optionChip, active && styles.optionChipActive]}
                    onPress={() => setDraftDate(key)}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sheetLabel}>Kategori</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catScroll}
            >
              <Pressable
                style={[styles.catOption, !draftCategory && styles.catOptionActive]}
                onPress={() => setDraftCategory(null)}
              >
                <Ionicons
                  name="apps-outline"
                  size={18}
                  color={!draftCategory ? colors.onBrand : colors.brand}
                />
                <Text style={[styles.catOptionText, !draftCategory && styles.catOptionTextActive]}>
                  Semua
                </Text>
              </Pressable>
              {filteredCategories.map((c) => {
                const active = draftCategory === c.id;
                return (
                  <Pressable
                    key={c.id}
                    style={[styles.catOption, active && styles.catOptionActive]}
                    onPress={() => setDraftCategory(c.id)}
                  >
                    <CategoryIcon icon={c.icon} color={c.color} size={14} box={28} />
                    <Text
                      style={[styles.catOptionText, active && styles.catOptionTextActive]}
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable style={styles.applyBtn} onPress={applyFilters}>
              <Text style={styles.applyBtnText}>Terapkan</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function createStyles(colors: ThemeColors, r: ReturnType<typeof useResponsive>) {
  return StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: r.pagePadding },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  kicker: {
    fontSize: r.ms(11),
    fontWeight: '700',
    color: colors.brand,
    letterSpacing: 0.4,
  },
  title: {
    fontSize: r.ms(22),
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  sub: { marginTop: 2, color: colors.muted, fontSize: r.ms(12), fontWeight: '600' },
  addBtn: {
    backgroundColor: colors.brand,
    borderRadius: 18,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, color: colors.text, padding: 0, fontSize: 14 },
  filterTrigger: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTriggerActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    marginBottom: 8,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  segmentItemActive: { backgroundColor: colors.brand },
  segmentText: { fontWeight: '700', fontSize: r.ms(12), color: colors.muted },
  segmentTextActive: { color: colors.onBrand },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brandSoft,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 8,
    maxWidth: '70%',
  },
  pillText: { color: colors.brand, fontWeight: '700', fontSize: r.ms(11) },
  clearAll: { color: colors.muted, fontWeight: '600', fontSize: r.ms(11) },
  hint: { color: colors.faint, fontSize: r.ms(11), marginBottom: 8 },
  emptyBox: {
    marginTop: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: { fontWeight: '800', fontSize: r.ms(15), color: colors.text },
  emptyBody: { color: colors.muted, textAlign: 'center', fontSize: r.ms(13) },
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
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginBottom: 6,
    gap: 10,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontWeight: '700', color: colors.text, fontSize: r.ms(13) },
  rowMetaRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  rowMeta: { color: colors.faint, fontSize: r.ms(11) },
  receiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.brandSoft,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.brandSoftBorder,
  },
  receiptBadgeText: { color: colors.brand, fontWeight: '800', fontSize: r.ms(10) },
  rowAmount: { fontWeight: '800', fontSize: r.ms(12), marginLeft: 4 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(7,17,31,0.58)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: r.pagePadding,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#07111f',
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 14,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.brandSoftBorder,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: r.ms(20), fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  sheetReset: { color: colors.brand, fontWeight: '800' },
  sheetLabel: {
    fontSize: r.ms(11),
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  optionRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  optionChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  optionChipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  optionText: { fontWeight: '700', color: colors.muted, fontSize: r.ms(13) },
  optionTextActive: { color: colors.onBrand },
  catScroll: { gap: 8, paddingBottom: 8 },
  catOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    maxWidth: 160,
  },
  catOptionActive: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  catOptionText: { fontWeight: '700', color: colors.text, fontSize: r.ms(13), maxWidth: 100 },
  catOptionTextActive: { color: colors.brandDark },
  applyBtn: {
    marginTop: 16,
    backgroundColor: colors.brand,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  applyBtnText: { color: colors.onBrand, fontWeight: '800', fontSize: r.ms(15) },
});
}
