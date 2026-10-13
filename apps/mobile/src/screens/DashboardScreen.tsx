import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { User } from '../lib/auth';
import {
  getDashboardSummary,
  getMarketQuotes,
  type DashboardSummary,
  type MarketQuotes,
  type Transaction,
} from '../lib/finance';
import { getBudgetStatus, type BudgetStatus } from '../lib/budget';
import { checkAndNotifyBudgetAlert } from '../lib/notifications';
import { runRecurringDue } from '../lib/recurring';
import { useFeatureEnabled } from '../lib/featureFlags';
import { shouldShowWelcome, markWelcomeShown, WELCOME_COPY } from '../lib/welcome';
import { exportTransactionsCsv } from '../lib/exportSummary';
import { buildDashboardInsights, getInsightToneColor } from '../lib/dashboardInsights';
import { formatIDR, formatIDRCompact, formatDateShort } from '../lib/format';
import { BrandMark } from '../components/ui';
import { CategoryIcon } from '../components/CategoryIcon';
import { CollapsibleSection } from '../components/CollapsibleSection';
import {
  FadeInUp,
  ScalePress,
  PopIn,
  AnimatedBar,
  PrivacyEyeToggle,
} from '../components/motion';
import { PageLoader } from '../components/PageStatus';
import { useDialog } from '../components/AppDialog';
import { radii, type ThemeColors } from '../theme';
import { useColors } from '../themeContext';
import { useResponsive } from '../hooks/useResponsive';
import type { MainStackParamList } from '../navigation/types';

const HIDDEN_AMOUNT = '••••';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

function TxRow({
  item,
  onPress,
  amountsVisible,
  delay = 0,
}: {
  item: Transaction;
  onPress: () => void;
  amountsVisible: boolean;
  delay?: number;
}) {
  const colors = useColors();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r), [colors, r]);
  const isIncome = item.type === 'INCOME';
  return (
    <FadeInUp delay={delay} distance={10}>
      <ScalePress style={styles.row} onPress={onPress}>
        <CategoryIcon icon={item.category.icon} color={item.category.color} size={14} box={32} />
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
        <Text style={[styles.rowAmount, { color: isIncome ? colors.income : colors.expense }]}>
          {amountsVisible ? (
            <>
              {isIncome ? '+' : '−'}
              {formatIDR(item.amount)}
            </>
          ) : (
            HIDDEN_AMOUNT
          )}
        </Text>
      </ScalePress>
    </FadeInUp>
  );
}

export function DashboardScreen({ user }: { user: User }) {
  const colors = useColors();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r), [colors, r]);
  const insightToneColor = useMemo(() => getInsightToneColor(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { showDialog } = useDialog();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [market, setMarket] = useState<MarketQuotes | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [amountsVisible, setAmountsVisible] = useState(true);
  const showMarket = useFeatureEnabled('market_widget');
  const showRecurring = useFeatureEnabled('recurring_transactions');

  const showAmount = (n: number) => (amountsVisible ? formatIDR(n) : HIDDEN_AMOUNT);
  const formatIHSG = (n: number) =>
    new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

  const openEdit = (id: string) => navigation.navigate('TransactionForm', { id });

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        if (showRecurring) {
          try {
            await runRecurringDue();
          } catch {
            // ignore: dashboard should still load
          }
        }
        const [data, quotes, budget] = await Promise.all([
          getDashboardSummary(period),
          showMarket ? getMarketQuotes() : Promise.resolve(null),
          getBudgetStatus(),
        ]);
        setSummary(data);
        setMarket(quotes);
        setBudgetStatus(budget);
        if (budget) checkAndNotifyBudgetAlert(budget).catch(() => {});
      } catch {
        setError('Gagal memuat ringkasan. Tarik untuk refresh.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period, showMarket, showRecurring]
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  // Delay past focus remounts so we don't clear pending without showing the dialog.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        const show = await shouldShowWelcome(user);
        if (cancelled || !show) return;
        showDialog({
          variant: 'success',
          title: WELCOME_COPY.title,
          message: user.name
            ? `Halo ${user.name.split(' ')[0]}! ${WELCOME_COPY.message}`
            : WELCOME_COPY.message,
          confirmLabel: WELCOME_COPY.confirmLabel,
          cancelLabel: 'Nanti saja',
          showCancel: true,
          onConfirm: () => navigation.navigate('TransactionForm', {}),
        });
        await markWelcomeShown(user.id);
      })();
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // Intentionally keyed by identity fields, not the whole user object.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- showDialog/navigation are stable enough for one-shot welcome
  }, [user.id, user.name, user.createdAt]);

  const recent = [
    ...(summary?.recentIncomes || []).map((t) => ({ ...t, type: 'INCOME' as const })),
    ...(summary?.recentExpenses || []).map((t) => ({ ...t, type: 'EXPENSE' as const })),
  ]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 5);

  const breakdown =
    summary?.expenseCategoryBreakdown ||
    summary?.categoryBreakdown ||
    summary?.topCategories ||
    [];
  const maxBreakdown = Math.max(...breakdown.map((b) => b.total), 1);
  const insights = summary ? buildDashboardInsights(summary).slice(0, 2) : [];
  const categoryItems = breakdown.slice(0, 4);

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
        <View style={styles.topBar}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Pressable onPress={() => Linking.openURL('http://10.44.202.55:5173')}>
              <BrandMark size="sm" />
            </Pressable>
            <Text style={styles.hello} numberOfLines={1}>
              {getGreeting()}, {user.name.split(' ')[0]}
            </Text>
          </View>
          <View style={styles.topActions}>
            {summary && (
              <Pressable
                onPress={async () => {
                  const txs = [
                    ...(summary.recentIncomes || []),
                    ...(summary.recentExpenses || []),
                  ];
                  await exportTransactionsCsv(txs, summary, period);
                }}
                style={styles.exportBtn}
                hitSlop={8}
              >
                <Ionicons name="share-social-outline" size={16} color={colors.brand} />
                <Text style={styles.exportBtnText}>Export</Text>
              </Pressable>
            )}
            <PrivacyEyeToggle
              visible={amountsVisible}
              onToggle={() => setAmountsVisible((v) => !v)}
            />
          </View>
        </View>
      </FadeInUp>

      {(showMarket && (market?.usdIdr || market?.gold || market?.biRate || market?.ihsg)) && (
        <FadeInUp delay={40}>
          <View style={styles.marketCard}>
            <View style={styles.marketHeader}>
              <Text style={styles.marketHeaderTitle}>Pasar hari ini</Text>
              <Text style={styles.marketHeaderHint}>Kurs · Emas · BI · IHSG</Text>
            </View>
            <View style={styles.marketStrip}>
              {market.usdIdr ? (
                <Pressable
                  style={styles.marketCell}
                  onPress={() => Linking.openURL('https://www.bi.go.id/id/statistik/informasi-kurs/transaksi-bi/default.aspx')}
                >
                  <View style={[styles.marketIcon, { backgroundColor: colors.brandSoft }]}>
                    <Ionicons name="logo-usd" size={15} color={colors.brand} />
                  </View>
                  <Text style={styles.marketLabel}>USD</Text>
                  <Text style={styles.marketValue} numberOfLines={1}>
                    {formatIDRCompact(market.usdIdr.rate)}
                  </Text>
                </Pressable>
              ) : null}
              {market.gold ? (
                <Pressable
                  style={[styles.marketCell, styles.marketCellDivider]}
                  onPress={() => Linking.openURL('https://www.logammulia.com/id')}
                >
                  <View style={[styles.marketIcon, { backgroundColor: colors.amberSoft }]}>
                    <Ionicons name="diamond-outline" size={15} color={colors.amber} />
                  </View>
                  <Text style={styles.marketLabel}>Emas</Text>
                  <Text style={styles.marketValue} numberOfLines={1}>
                    {formatIDRCompact(market.gold.sellPerGram)}
                  </Text>
                  {market.gold.buybackPerGram ? (
                    <Text style={styles.marketSub} numberOfLines={1}>
                      BB {formatIDRCompact(market.gold.buybackPerGram)}
                    </Text>
                  ) : null}
                </Pressable>
              ) : null}
              {market.biRate ? (
                <Pressable
                  style={[styles.marketCell, styles.marketCellDivider]}
                  onPress={() => Linking.openURL('https://www.bi.go.id/id/statistik/indikator/bi-rate.aspx')}
                >
                  <View style={[styles.marketIcon, { backgroundColor: colors.brandSoft }]}>
                    <Ionicons name="stats-chart-outline" size={15} color={colors.brand} />
                  </View>
                  <Text style={styles.marketLabel}>BI Rate</Text>
                  <Text style={styles.marketValue} numberOfLines={1}>
                    {Number.isFinite(market.biRate.rate)
                      ? `${market.biRate.rate.toFixed(2)}%`
                      : market.biRate.percentLabel}
                  </Text>
                </Pressable>
              ) : null}
              {market.ihsg ? (
                <Pressable
                  style={[styles.marketCell, styles.marketCellDivider]}
                  onPress={() => Linking.openURL('https://www.idx.co.id/id')}
                >
                  <View style={[styles.marketIcon, { backgroundColor: market.ihsg.changePct >= 0 ? '#dcfce7' : '#ffe4e6' }]}>
                    <Ionicons
                      name="trending-up-outline"
                      size={15}
                      color={market.ihsg.changePct >= 0 ? '#16a34a' : '#e11d48'}
                    />
                  </View>
                  <Text style={styles.marketLabel}>IHSG</Text>
                  <Text style={styles.marketValue} numberOfLines={1}>
                    {formatIHSG(market.ihsg.value)}
                  </Text>
                  <Text style={[styles.marketSub, { color: market.ihsg.changePct >= 0 ? '#16a34a' : '#e11d48' }]} numberOfLines={1}>
                    {market.ihsg.changePct >= 0 ? '+' : ''}{market.ihsg.changePctLabel}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </FadeInUp>
      )}

      <FadeInUp delay={70}>
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

      {budgetStatus?.hasBudget ? (
        <FadeInUp delay={55}>
          <ScalePress style={styles.budgetCard} onPress={() => navigation.navigate('Budget')}>
            <View style={styles.budgetTop}>
              <Text style={styles.budgetLabel}>Budget bulan ini</Text>
              <Text style={styles.budgetLink}>Detail</Text>
            </View>
            {(budgetStatus.isNearLimit || budgetStatus.isOverLimit) && (
              <Text
                style={[
                  styles.budgetAlert,
                  { color: budgetStatus.isOverLimit ? colors.expense : colors.amber },
                ]}
              >
                {budgetStatus.isOverLimit ? 'Melewati limit!' : 'Sudah ≥ 80%'}
              </Text>
            )}
            <Text style={styles.budgetAmount}>
              {showAmount(budgetStatus.totalSpent)} / {showAmount(budgetStatus.totalBudget)}
            </Text>
            <View style={styles.budgetTrack}>
              <View
                style={[
                  styles.budgetFill,
                  {
                    width: `${Math.min(budgetStatus.percentUsed, 100)}%` as `${number}%`,
                    backgroundColor: budgetStatus.isOverLimit
                      ? colors.expense
                      : budgetStatus.isNearLimit
                        ? colors.amber
                        : colors.brand,
                  },
                ]}
              />
            </View>
          </ScalePress>
        </FadeInUp>
      ) : (
        <FadeInUp delay={55}>
          <ScalePress style={styles.budgetCardEmpty} onPress={() => navigation.navigate('Budget')}>
            <Ionicons name="wallet-outline" size={18} color={colors.brand} />
            <Text style={styles.budgetEmptyText}>Atur budget bulan ini</Text>
          </ScalePress>
        </FadeInUp>
      )}

      {loading && !summary ? (
        <PageLoader label="Memuat beranda…" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : summary ? (
        <>
          <PopIn delay={90}>
            <View style={styles.balanceCard}>
              <View style={styles.balanceTop}>
                <Text style={styles.balanceLabel}>Saldo</Text>
                <Text style={styles.balanceRange}>
                  {formatDateShort(summary.periodStart)} – {formatDateShort(summary.periodEnd)}
                </Text>
              </View>
              <Text
                style={[
                  styles.balanceValue,
                  { color: summary.balance >= 0 ? colors.income : colors.expense },
                ]}
              >
                {showAmount(summary.balance)}
              </Text>
            </View>
          </PopIn>

          <FadeInUp delay={130}>
            <View style={styles.statRow}>
              <View style={[styles.statCard, { borderColor: colors.incomeBorder }]}>
                <View style={styles.statHead}>
                  <Ionicons name="arrow-down-circle" size={16} color={colors.income} />
                  <Text style={styles.statLabel}>Masuk</Text>
                </View>
                <Text style={[styles.statValue, { color: colors.income }]}>
                  {showAmount(summary.totalIncome)}
                </Text>
              </View>
              <View style={[styles.statCard, { borderColor: colors.expenseBorder }]}>
                <View style={styles.statHead}>
                  <Ionicons name="arrow-up-circle" size={16} color={colors.expense} />
                  <Text style={styles.statLabel}>Keluar</Text>
                </View>
                <Text style={[styles.statValue, { color: colors.expense }]}>
                  {showAmount(summary.totalExpenses)}
                </Text>
              </View>
            </View>
          </FadeInUp>

          {amountsVisible && insights.length > 0 ? (
            <FadeInUp delay={160}>
              <CollapsibleSection title="Saran AI" count={insights.length} defaultOpen>
                {insights.map((insight) => (
                  <View key={insight.id} style={styles.insightCard}>
                    <Text
                      style={[styles.insightTitle, { color: insightToneColor[insight.tone] }]}
                      numberOfLines={1}
                    >
                      {insight.title}
                    </Text>
                    <Text style={styles.insightBody} numberOfLines={2}>
                      {insight.message}
                    </Text>
                  </View>
                ))}
              </CollapsibleSection>
            </FadeInUp>
          ) : null}

          {categoryItems.length > 0 ? (
            <FadeInUp delay={190}>
              <CollapsibleSection title="Per kategori" count={categoryItems.length} defaultOpen>
                {categoryItems.map((item) => (
                  <View key={item.categoryId || item.categoryName} style={styles.barRow}>
                    <View style={styles.barMeta}>
                      <Text style={styles.barName} numberOfLines={1}>
                        {item.categoryName}
                      </Text>
                      <Text style={styles.barAmount}>{showAmount(item.total)}</Text>
                    </View>
                    <AnimatedBar
                      progress={item.total / maxBreakdown}
                      color={item.categoryColor || item.color || colors.brand}
                    />
                  </View>
                ))}
              </CollapsibleSection>
            </FadeInUp>
          ) : null}

          <FadeInUp delay={220}>
            <Text style={styles.sectionTitle}>Terbaru</Text>
          </FadeInUp>
          {recent.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Belum ada transaksi</Text>
              <Text style={styles.emptyBody}>Tap + untuk mulai mencatat.</Text>
            </View>
          ) : (
            recent.map((item, i) => (
              <TxRow
                key={`${item.type}-${item.id}`}
                item={item}
                amountsVisible={amountsVisible}
                delay={240 + i * 45}
                onPress={() => openEdit(item.id)}
              />
            ))
          )}
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
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    hello: {
      marginTop: 4,
      fontSize: r.ms(22),
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.4,
    },
    topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    exportBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: colors.brandSoft,
    },
    exportBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.brand,
    },
    marketCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      paddingTop: 12,
      paddingBottom: 10,
      paddingHorizontal: 4,
      marginBottom: 12,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    marketHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      marginBottom: 10,
    },
    marketHeaderTitle: {
      fontSize: r.ms(13),
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.2,
    },
    marketHeaderHint: {
      fontSize: r.ms(11),
      fontWeight: '600',
      color: colors.muted,
    },
    marketStrip: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    marketCell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingHorizontal: 6,
      paddingVertical: 4,
      minHeight: 86,
    },
    marketCellDivider: {
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: colors.border,
    },
    marketIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    marketLabel: {
      color: colors.muted,
      fontSize: r.ms(11),
      fontWeight: '700',
      letterSpacing: 0.2,
      marginBottom: 2,
    },
    marketValue: {
      fontWeight: '800',
      color: colors.text,
      fontSize: r.ms(14),
      letterSpacing: -0.3,
      textAlign: 'center',
    },
    marketSub: {
      marginTop: 2,
      color: colors.faint,
      fontSize: r.ms(10),
      fontWeight: '600',
      textAlign: 'center',
    },
    budgetCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 12,
    },
    budgetCardEmpty: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.brandSoft,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.brandSoftBorder,
      padding: 12,
      marginBottom: 12,
    },
    budgetEmptyText: { fontWeight: '700', color: colors.brandDark, fontSize: r.ms(13) },
    budgetTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    budgetLabel: { fontSize: r.ms(12), fontWeight: '700', color: colors.muted },
    budgetLink: { fontSize: r.ms(12), fontWeight: '700', color: colors.brand },
    budgetAlert: { fontSize: r.ms(11), fontWeight: '800', marginBottom: 4 },
    budgetAmount: { fontSize: r.ms(14), fontWeight: '800', color: colors.text, marginBottom: 8 },
    budgetTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.track,
      overflow: 'hidden',
    },
    budgetFill: { height: '100%', borderRadius: 999 },
    periodSeg: {
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
      paddingVertical: r.vs(8),
      borderRadius: radii.sm,
      alignItems: 'center',
    },
    periodItemActive: { backgroundColor: colors.brand },
    periodText: { fontWeight: '700', fontSize: r.ms(12), color: colors.muted },
    periodTextActive: { color: colors.onBrand },
    balanceCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: r.ms(14),
      marginBottom: 10,
    },
    balanceTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    balanceLabel: { color: colors.muted, fontWeight: '700', fontSize: r.ms(12) },
    balanceValue: { fontSize: r.ms(26), fontWeight: '800', marginTop: 4, letterSpacing: -0.6 },
    balanceRange: { color: colors.faint, fontSize: r.ms(11) },
    statRow: {
      flexDirection: r.isCompact ? 'column' : 'row',
      gap: 8,
      marginBottom: 14,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      padding: 10,
    },
    statHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    statLabel: { color: colors.muted, fontSize: r.ms(11), fontWeight: '700' },
    statValue: { fontSize: r.ms(14), fontWeight: '800', marginTop: 6 },
    sectionTitle: {
      fontSize: r.ms(13),
      fontWeight: '800',
      color: colors.text,
      marginBottom: 8,
      marginTop: 4,
      letterSpacing: 0.2,
    },
    insightCard: {
      backgroundColor: colors.bg,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 10,
      marginBottom: 6,
    },
    insightTitle: { fontWeight: '800', fontSize: r.ms(13), marginBottom: 2 },
    insightBody: { color: colors.muted, fontSize: r.ms(12), lineHeight: 16 },
    barRow: { marginBottom: 8 },
    barMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    barName: { flex: 1, fontWeight: '600', color: colors.text, fontSize: r.ms(12), marginRight: 8 },
    barAmount: { fontWeight: '700', color: colors.muted, fontSize: r.ms(11) },
    emptyBox: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },
    emptyTitle: { fontWeight: '800', color: colors.text, fontSize: r.ms(14) },
    emptyBody: { marginTop: 4, color: colors.muted, fontSize: r.ms(12) },
    error: {
      backgroundColor: colors.dangerBg,
      color: colors.dangerText,
      padding: 10,
      borderRadius: 12,
      marginTop: 8,
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
    rowAmount: { fontWeight: '800', fontSize: r.ms(12) },
  });
}
