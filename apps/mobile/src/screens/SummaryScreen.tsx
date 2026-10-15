import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getDashboardSummary,
  type DashboardSummary,
} from '../lib/finance';
import { formatIDR, formatDateShort } from '../lib/format';
import { shareSummaryReport } from '../lib/exportSummary';
import { BrandMark } from '../components/ui';
import { FadeInUp, ScalePress, PopIn, AnimatedBar } from '../components/motion';
import { PageLoader } from '../components/PageStatus';
import { radii, type ThemeColors } from '../theme';
import { useColors } from '../themeContext';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../authContext';
import { hasProAccess } from '../lib/plan';
import { useDialog } from '../components/AppDialog';
import type { MainStackParamList } from '../navigation/types';

export function SummaryScreen() {
  const colors = useColors();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r), [colors, r]);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showDialog } = useDialog();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const data = await getDashboardSummary(period);
        setSummary(data);
      } catch {
        setError('Gagal memuat ringkasan.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period]
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const breakdown =
    summary?.expenseCategoryBreakdown ||
    summary?.categoryBreakdown ||
    summary?.topCategories ||
    [];
  const maxBreakdown = Math.max(...breakdown.map((b) => b.total), 1);

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        r.pageStyle,
        {
          paddingTop: Math.max(insets.top, 10) + 8,
          paddingBottom: 28,
        },
      ]}
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
    >
      <View style={r.contentStyle}>
      <FadeInUp>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <BrandMark size="sm" />
            <Text style={styles.title}>Ringkasan</Text>
            <Text style={styles.sub}>Pemasukan & pengeluaran periode ini</Text>
          </View>
          {summary ? (
            <ScalePress
              style={styles.shareBtn}
              onPress={() => {
                if (!hasProAccess(user)) {
                  showDialog({
                    title: 'Fitur Pro',
                    message:
                      'Bagikan laporan tersedia di Dompet Tenang Pro. Admin otomatis punya akses Pro.',
                    confirmLabel: 'Mengerti',
                  });
                  return;
                }
                void shareSummaryReport(summary, period);
              }}
            >
              <Ionicons name="share-outline" size={18} color={colors.brand} />
              <Text style={styles.shareText}>
                Bagikan{hasProAccess(user) ? '' : ' · Pro'}
              </Text>
            </ScalePress>
          ) : null}
        </View>
      </FadeInUp>

      <FadeInUp delay={40}>
        <View style={styles.periodSeg}>
          {(['week', 'month', 'year'] as const).map((p) => {
            const active = period === p;
            return (
              <Pressable
                key={p}
                style={[styles.periodItem, active && styles.periodItemActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodText, active && styles.periodTextActive]}>
                  {p === 'week' ? 'Minggu' : p === 'month' ? 'Bulan' : 'Tahun'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </FadeInUp>

      {loading && !summary ? (
        <PageLoader label="Memuat ringkasan…" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : summary ? (
        <>
          <PopIn delay={70}>
            <View style={styles.rangeCard}>
              <Ionicons name="calendar-outline" size={16} color={colors.brand} />
              <Text style={styles.rangeText}>
                {formatDateShort(summary.periodStart)} – {formatDateShort(summary.periodEnd)}
              </Text>
            </View>
          </PopIn>

          <FadeInUp delay={90}>
            <View style={styles.statCol}>
              <ScalePress
                style={[styles.bigCard, { borderColor: colors.incomeBorder }]}
                onPress={() => navigation.navigate('TransactionForm', { type: 'INCOME' })}
              >
                <View style={styles.bigHead}>
                  <View style={[styles.bigIcon, { backgroundColor: colors.incomeSoft }]}>
                    <Ionicons name="arrow-down-circle" size={22} color={colors.income} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bigLabel}>Pemasukan</Text>
                    <Text style={styles.bigCount}>{summary.incomeCount || 0} transaksi</Text>
                  </View>
                  <Ionicons name="add-circle" size={22} color={colors.income} />
                </View>
                <Text style={[styles.bigValue, { color: colors.income }]}>
                  {formatIDR(summary.totalIncome)}
                </Text>
              </ScalePress>

              <ScalePress
                style={[styles.bigCard, { borderColor: colors.expenseBorder }]}
                onPress={() => navigation.navigate('TransactionForm', { type: 'EXPENSE' })}
              >
                <View style={styles.bigHead}>
                  <View style={[styles.bigIcon, { backgroundColor: colors.expenseSoft }]}>
                    <Ionicons name="arrow-up-circle" size={22} color={colors.expense} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bigLabel}>Pengeluaran</Text>
                    <Text style={styles.bigCount}>{summary.expenseCount || 0} transaksi</Text>
                  </View>
                  <Ionicons name="add-circle" size={22} color={colors.expense} />
                </View>
                <Text style={[styles.bigValue, { color: colors.expense }]}>
                  {formatIDR(summary.totalExpenses)}
                </Text>
              </ScalePress>
            </View>
          </FadeInUp>

          <FadeInUp delay={120}>
            <View style={styles.balanceBox}>
              <Text style={styles.balanceLabel}>Saldo periode</Text>
              <Text
                style={[
                  styles.balanceValue,
                  { color: summary.balance >= 0 ? colors.income : colors.expense },
                ]}
              >
                {formatIDR(summary.balance)}
              </Text>
            </View>
          </FadeInUp>

          {breakdown.length > 0 ? (
            <FadeInUp delay={150}>
              <Text style={styles.sectionTitle}>Pengeluaran per kategori</Text>
              {breakdown.slice(0, 6).map((item) => (
                <View key={item.categoryId || item.categoryName} style={styles.barRow}>
                  <View style={styles.barMeta}>
                    <Text style={styles.barName} numberOfLines={1}>
                      {item.categoryName}
                    </Text>
                    <Text style={styles.barAmount}>{formatIDR(item.total)}</Text>
                  </View>
                  <AnimatedBar
                    progress={item.total / maxBreakdown}
                    color={item.categoryColor || item.color || colors.brand}
                  />
                </View>
              ))}
            </FadeInUp>
          ) : null}
        </>
      ) : null}
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors, r: ReturnType<typeof useResponsive>) {
  return StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg },
    content: { flexGrow: 1 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 2,
    },
    shareBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.brandSoftBorder,
      backgroundColor: colors.brandSoft,
      minWidth: 72,
    },
    shareText: {
      marginTop: 2,
      fontSize: r.ms(10),
      fontWeight: '700',
      color: colors.brandDark,
    },
    title: {
      marginTop: 8,
      fontSize: r.ms(26),
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.4,
    },
    sub: { marginTop: 4, color: colors.muted, fontSize: r.ms(13), fontWeight: '600' },
    periodSeg: {
      marginTop: 14,
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 3,
      marginBottom: 12,
    },
    periodItem: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: radii.sm,
      alignItems: 'center',
    },
    periodItemActive: { backgroundColor: colors.brand },
    periodText: { fontWeight: '700', fontSize: r.ms(12), color: colors.muted },
    periodTextActive: { color: colors.onBrand },
    rangeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surface,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12,
      alignSelf: 'flex-start',
    },
    rangeText: { color: colors.textSoft, fontWeight: '700', fontSize: r.ms(12) },
    statCol: {
      gap: 10,
      marginBottom: 12,
      flexDirection: r.isTablet ? 'row' : 'column',
    },
    bigCard: {
      flex: r.isTablet ? 1 : undefined,
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      borderWidth: 1.5,
      padding: 14,
    },
    bigHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    bigIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bigLabel: { fontWeight: '800', color: colors.text, fontSize: r.ms(15) },
    bigCount: { marginTop: 1, color: colors.faint, fontSize: r.ms(11), fontWeight: '600' },
    bigValue: { fontSize: r.ms(24), fontWeight: '900', letterSpacing: -0.5 },
    balanceBox: {
      backgroundColor: colors.brandSoft,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.brandSoftBorder,
      padding: 14,
      marginBottom: 16,
    },
    balanceLabel: { color: colors.brandDark, fontWeight: '700', fontSize: r.ms(12) },
    balanceValue: { marginTop: 4, fontSize: r.ms(22), fontWeight: '900', letterSpacing: -0.4 },
    sectionTitle: {
      fontSize: r.ms(14),
      fontWeight: '800',
      color: colors.text,
      marginBottom: 10,
    },
    barRow: { marginBottom: 10 },
    barMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
      gap: 8,
    },
    barName: { flex: 1, fontWeight: '700', color: colors.text, fontSize: r.ms(13) },
    barAmount: { fontWeight: '800', color: colors.textSoft, fontSize: r.ms(12) },
    error: {
      backgroundColor: colors.dangerBg,
      color: colors.dangerText,
      padding: 12,
      borderRadius: radii.md,
      marginTop: 8,
    },
  });
}
