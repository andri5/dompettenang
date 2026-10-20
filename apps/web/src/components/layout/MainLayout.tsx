/**
 * Dompet Tenang - Main Layout
 * Desktop rail + mobile bottom navigation
 */

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  FolderOpen,
  Settings,
  LogOut,
  Wallet,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  ArrowLeftRight,
  CircleHelp,
  PiggyBank,
  Repeat,
  MoreHorizontal,
  Target,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, useUIStore } from '@/stores';
import { ROUTES } from '@/lib/constants';
import { UserAvatar } from '@/components/ui';
import { useFeatureEnabled } from '@/hooks';
import type { FeatureFlagKey } from '@/hooks';
import { fetchProRequestsSummary } from '@/services/billing.service';
import { getCurrentUser } from '@/services/auth.service';
import { hasProAccess } from '@/lib/plan';
import { shouldOfferProWelcome } from '@/lib/proWelcome';
import { ProWelcomeTour } from '@/components/pro/ProWelcomeTour';

interface MainLayoutProps {
  children: ReactNode;
}

const transactionChildren = [
  {
    icon: TrendingUp,
    label: 'Pemasukan',
    path: ROUTES.INCOMES,
    hint: 'Catat uang masuk',
  },
  {
    icon: Receipt,
    label: 'Pengeluaran',
    path: ROUTES.EXPENSES,
    hint: 'Catat uang keluar',
  },
];

const primaryNav: Array<{
  icon: typeof LayoutDashboard;
  label: string;
  shortLabel: string;
  path: string;
  flag?: FeatureFlagKey;
  pro?: boolean;
}> = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    shortLabel: 'Home',
    path: ROUTES.DASHBOARD,
  },
  {
    icon: PiggyBank,
    label: 'Budget',
    shortLabel: 'Budget',
    path: ROUTES.BUDGET,
  },
  {
    icon: Target,
    label: 'Target Tabungan',
    shortLabel: 'Tabungan',
    path: ROUTES.SAVINGS,
    flag: 'savings_goals',
    pro: true,
  },
  {
    icon: Repeat,
    label: 'Transaksi Otomatis',
    shortLabel: 'Otomatis',
    path: ROUTES.RECURRING,
    flag: 'recurring_transactions',
    pro: true,
  },
  {
    icon: FolderOpen,
    label: 'Kategori',
    shortLabel: 'Kategori',
    path: ROUTES.CATEGORIES,
  },
  {
    icon: CircleHelp,
    label: 'Bantuan',
    shortLabel: 'Bantuan',
    path: ROUTES.HELP,
  },
  {
    icon: Settings,
    label: 'Akun',
    shortLabel: 'Akun',
    path: ROUTES.SETTINGS,
  },
];

const moreMenuItems: Array<{
  icon: typeof Target;
  label: string;
  path: string;
  flag?: FeatureFlagKey;
  pro?: boolean;
}> = [
  {
    icon: Target,
    label: 'Target Tabungan',
    path: ROUTES.SAVINGS,
    flag: 'savings_goals',
    pro: true,
  },
  {
    icon: Repeat,
    label: 'Transaksi Otomatis',
    path: ROUTES.RECURRING,
    flag: 'recurring_transactions',
    pro: true,
  },
  { icon: FolderOpen, label: 'Kategori', path: ROUTES.CATEGORIES },
  { icon: CircleHelp, label: 'Bantuan', path: ROUTES.HELP },
  { icon: Settings, label: 'Akun', path: ROUTES.SETTINGS },
];

function isPathActive(pathname: string, path: string) {
  return (
    pathname === path || (path !== ROUTES.DASHBOARD && pathname.startsWith(path))
  );
}

function isTransactionActive(pathname: string) {
  return (
    pathname.startsWith(ROUTES.INCOMES) || pathname.startsWith(ROUTES.EXPENSES)
  );
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const { isSidebarOpen, toggleSidebar, setMobileMenuOpen } = useUIStore();
  const showSavings = useFeatureEnabled('savings_goals');
  const showRecurring = useFeatureEnabled('recurring_transactions');
  const showAdminPanel = useFeatureEnabled('admin_panel');
  const isPro = hasProAccess(user);
  const { data: proSummary } = useQuery({
    queryKey: ['admin', 'pro-requests', 'summary'],
    queryFn: fetchProRequestsSummary,
    enabled: Boolean(user?.role === 'ADMIN' && showAdminPanel),
    refetchInterval: 30_000,
  });
  const proOpenCount = proSummary?.open ?? 0;
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [transactionOpen, setTransactionOpen] = useState(() =>
    isTransactionActive(location.pathname)
  );
  const [mobileTransactionOpen, setMobileTransactionOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [proWelcomeOpen, setProWelcomeOpen] = useState(false);

  const refreshUserAndMaybeOfferProWelcome = useCallback(async () => {
    if (!useAuthStore.getState().user) return;
    try {
      const me = await getCurrentUser();
      setUser(me);
      if (shouldOfferProWelcome(me)) {
        setProWelcomeOpen(true);
      }
    } catch {
      /* ignore — session may be mid-refresh */
    }
  }, [setUser]);

  useEffect(() => {
    if (shouldOfferProWelcome(user)) {
      setProWelcomeOpen(true);
    }
  }, [user?.id, user?.plan]);

  useEffect(() => {
    if (!user?.id) return;

    const onFocus = () => {
      void refreshUserAndMaybeOfferProWelcome();
    };
    window.addEventListener('focus', onFocus);

    const intervalId = window.setInterval(() => {
      void refreshUserAndMaybeOfferProWelcome();
    }, 60_000);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.clearInterval(intervalId);
    };
  }, [user?.id, refreshUserAndMaybeOfferProWelcome]);

  const flagOn = (flag?: FeatureFlagKey) => {
    if (!flag) return true;
    if (flag === 'savings_goals') return showSavings;
    if (flag === 'recurring_transactions') return showRecurring;
    return true;
  };

  const sidebarNav = primaryNav.slice(1).filter((item) => flagOn(item.flag));
  const filteredMoreMenu = moreMenuItems.filter((item) => flagOn(item.flag));

  useEffect(() => {
    setMobileMenuOpen(false);
    setQuickAddOpen(false);
    setMobileTransactionOpen(false);
    setMoreMenuOpen(false);
    if (isTransactionActive(location.pathname)) {
      setTransactionOpen(true);
    }
  }, [location.pathname, setMobileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="app-shell-bg relative flex min-h-dvh overflow-x-clip">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 hidden h-dvh flex-col border-r border-white/10 text-white transition-[width] duration-300 lg:flex',
          isSidebarOpen ? 'w-64' : 'w-[88px]'
        )}
        style={{ backgroundColor: 'var(--color-sidebar)' }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute bottom-20 right-0 h-32 w-32 rounded-full bg-accent-bright/20 blur-3xl" />
        </div>

        <div className="relative flex h-20 items-center px-4">
          <Link to={ROUTES.DASHBOARD} className="flex items-center gap-3">
            <div className="brand-mark flex h-11 w-11 items-center justify-center rounded-2xl text-ink shadow-lg shadow-accent/30">
              <Wallet className="h-5 w-5" />
            </div>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="min-w-0"
              >
                <p className="font-display text-lg font-bold leading-none tracking-[-0.04em]">
                  Dompet Tenang
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">
                  Finance OS
                </p>
              </motion.div>
            )}
          </Link>
        </div>

        <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {/* Dashboard */}
          {(() => {
            const item = primaryNav[0];
            const isActive = isPathActive(location.pathname, item.path);
            return (
              <Link
                to={item.path}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-white/10 text-white shadow-inner ring-1 ring-accent/40'
                    : 'text-white/65 hover:bg-white/5 hover:text-white',
                  !isSidebarOpen && 'justify-center px-2'
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                    isActive
                      ? 'bg-accent text-ink'
                      : 'bg-white/5 text-white/80 group-hover:bg-white/10'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                {isSidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })()}

          {/* Transaksi group */}
          <div>
            <button
              type="button"
              onClick={() => {
                if (!isSidebarOpen) {
                  toggleSidebar();
                  setTransactionOpen(true);
                  return;
                }
                setTransactionOpen((open) => !open);
              }}
              className={cn(
                'group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all',
                isTransactionActive(location.pathname)
                  ? 'bg-white/10 text-white shadow-inner ring-1 ring-accent/40'
                  : 'text-white/65 hover:bg-white/5 hover:text-white',
                !isSidebarOpen && 'justify-center px-2'
              )}
              aria-expanded={transactionOpen}
            >
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                  isTransactionActive(location.pathname)
                    ? 'bg-accent text-ink'
                    : 'bg-white/5 text-white/80 group-hover:bg-white/10'
                )}
              >
                <ArrowLeftRight className="h-4 w-4" />
              </span>
              {isSidebarOpen && (
                <>
                  <span className="flex-1 text-left">Transaksi</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-white/50 transition',
                      transactionOpen && 'rotate-180'
                    )}
                  />
                </>
              )}
            </button>

            <AnimatePresence initial={false}>
              {isSidebarOpen && transactionOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-3">
                    {transactionChildren.map((child) => {
                      const active = isPathActive(location.pathname, child.path);
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={cn(
                            'flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm font-medium transition',
                            active
                              ? 'bg-white/10 text-white'
                              : 'text-white/60 hover:bg-white/5 hover:text-white'
                          )}
                        >
                          <child.icon className="h-4 w-4 flex-shrink-0" />
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Kategori + Akun */}
          {sidebarNav.map((item) => {
            const isActive = isPathActive(location.pathname, item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-white/10 text-white shadow-inner ring-1 ring-accent/40'
                    : 'text-white/65 hover:bg-white/5 hover:text-white',
                  !isSidebarOpen && 'justify-center px-2'
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                    isActive
                      ? 'bg-accent text-ink'
                      : 'bg-white/5 text-white/80 group-hover:bg-white/10'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                {isSidebarOpen && (
                  <span className="flex flex-1 items-center justify-between gap-2">
                    {item.label}
                    {item.pro && !isPro ? (
                      <span className="rounded-md bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                        Pro
                      </span>
                    ) : null}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Admin link */}
          {user?.role === 'ADMIN' && showAdminPanel && (
            <Link
              to={proOpenCount > 0 ? ROUTES.ADMIN_PRO : ROUTES.ADMIN}
              className={cn(
                'group mt-2 flex items-center gap-3 rounded-2xl border border-violet-500/30 px-3 py-3 text-sm font-semibold transition-all',
                location.pathname.startsWith('/admin')
                  ? 'bg-violet-600/20 text-violet-300 ring-1 ring-violet-500/40'
                  : 'text-violet-300/70 hover:bg-violet-600/10 hover:text-violet-300',
                !isSidebarOpen && 'justify-center px-2'
              )}
            >
              <span
                className={cn(
                  'relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                  location.pathname.startsWith('/admin')
                    ? 'bg-violet-600 text-white'
                    : 'bg-violet-600/20 text-violet-300 group-hover:bg-violet-600/30'
                )}
              >
                <Shield className="h-4 w-4" />
                {proOpenCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {proOpenCount > 99 ? '99+' : proOpenCount}
                  </span>
                ) : null}
              </span>
              {isSidebarOpen && (
                <span className="flex flex-1 items-center justify-between gap-2">
                  Admin Panel
                  {proOpenCount > 0 ? (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      Pro {proOpenCount}
                    </span>
                  ) : null}
                </span>
              )}
            </Link>
          )}
        </nav>

        <div className="relative space-y-2 border-t border-white/10 p-3">
          <button
            onClick={toggleSidebar}
            className={cn(
              'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-white/60 transition hover:bg-white/5 hover:text-white',
              !isSidebarOpen && 'justify-center'
            )}
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Ciutkan</span>
              </>
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          <div
            className={cn(
              'flex items-center gap-3 rounded-2xl bg-white/5 p-3',
              !isSidebarOpen && 'justify-center p-2'
            )}
          >
            <UserAvatar
              name={user?.name}
              avatar={user?.avatar}
              size="md"
              className="bg-accent/20 text-accent-bright ring-white/10"
            />
            {isSidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user?.name}</p>
                <p className="truncate text-xs text-white/50">{user?.email}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={cn(
              'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-white/60 transition hover:bg-coral/20 hover:text-white',
              !isSidebarOpen && 'justify-center'
            )}
          >
            <LogOut className="h-4 w-4" />
            {isSidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Mobile top brand bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-[calc(3.5rem+var(--safe-top))] items-end border-b border-line/80 bg-surface/90 px-3 pb-2.5 backdrop-blur-xl sm:px-4 lg:hidden">
        <div className="flex w-full items-center justify-between gap-2">
          <Link to={ROUTES.DASHBOARD} className="flex min-w-0 items-center gap-2">
            <div className="brand-mark flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-ink">
              <Wallet className="h-4 w-4" />
            </div>
            <span className="truncate font-display text-base font-bold tracking-[-0.04em] text-ink sm:text-lg">
              Dompet Tenang
            </span>
          </Link>
          <button
            type="button"
            onClick={() => {
              setMobileTransactionOpen(false);
              setQuickAddOpen((open) => !open);
            }}
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white shadow-md shadow-accent/25"
            aria-expanded={quickAddOpen}
            aria-label="Catat transaksi"
          >
            {quickAddOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            Catat
          </button>
        </div>
      </header>

      {/* Quick add / transaction sheets (mobile) */}
      <AnimatePresence>
        {(quickAddOpen || mobileTransactionOpen) && (
          <>
            <motion.button
              type="button"
              aria-label="Tutup menu"
              className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setQuickAddOpen(false);
                setMobileTransactionOpen(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="fixed left-3 right-3 z-50 rounded-2xl border border-line bg-surface p-2 shadow-[var(--shadow-lift)] lg:hidden"
              style={{
                top: quickAddOpen
                  ? 'calc(3.75rem + var(--safe-top))'
                  : undefined,
                bottom: mobileTransactionOpen
                  ? 'calc(4.75rem + var(--safe-bottom))'
                  : undefined,
              }}
            >
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {quickAddOpen ? 'Catat baru' : 'Transaksi'}
              </p>
              {transactionChildren.map((child) => (
                <Link
                  key={`${quickAddOpen ? 'add' : 'list'}-${child.path}`}
                  to={quickAddOpen ? `${child.path}/new` : child.path}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-mist"
                  onClick={() => {
                    setQuickAddOpen(false);
                    setMobileTransactionOpen(false);
                  }}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      child.path === ROUTES.INCOMES
                        ? 'bg-lime-soft text-lime'
                        : 'bg-coral-soft text-coral'
                    )}
                  >
                    <child.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">
                      {quickAddOpen ? `Tambah ${child.label}` : child.label}
                    </span>
                    <span className="block text-xs text-muted">{child.hint}</span>
                  </span>
                </Link>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main
        className={cn(
          'relative w-full flex-1 pb-[calc(5.75rem+var(--safe-bottom))] pt-[calc(3.5rem+var(--safe-top))] transition-[margin] duration-300 lg:pb-0 lg:pt-0',
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-[88px]'
        )}
      >
        <div className="mx-auto min-h-full w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>

      {/* "More" menu popover (mobile) */}
      <AnimatePresence>
        {moreMenuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Tutup menu"
              className="fixed inset-0 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="fixed inset-x-3 z-50 rounded-2xl border border-line bg-surface p-2 shadow-[var(--shadow-lift)] lg:hidden"
              style={{ bottom: 'calc(4.75rem + var(--safe-bottom))' }}
            >
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Lainnya
              </p>
              {filteredMoreMenu.map((item) => {
                const active = isPathActive(location.pathname, item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-mist',
                      active && 'bg-accent-soft/50'
                    )}
                    onClick={() => setMoreMenuOpen(false)}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl',
                        active ? 'bg-accent-soft text-accent' : 'bg-mist text-muted'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span
                      className={cn(
                        'flex flex-1 items-center justify-between gap-2 text-sm font-semibold',
                        active ? 'text-accent' : 'text-ink'
                      )}
                    >
                      {item.label}
                      {item.pro && !isPro ? (
                        <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold text-accent">
                          Pro
                        </span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile bottom nav — 4 tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-surface/95 px-0.5 pb-[calc(0.35rem+var(--safe-bottom))] pt-1.5 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-0">
          <Link
            to={ROUTES.DASHBOARD}
            className={cn(
              'flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] font-semibold transition sm:text-[11px]',
              isPathActive(location.pathname, ROUTES.DASHBOARD) ? 'text-accent' : 'text-muted'
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-xl transition sm:h-9 sm:w-9',
                isPathActive(location.pathname, ROUTES.DASHBOARD) ? 'bg-accent-soft text-accent' : 'bg-transparent'
              )}
            >
              <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <span className="w-full truncate text-center">Home</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setMoreMenuOpen(false);
              setQuickAddOpen(false);
              setMobileTransactionOpen((open) => !open);
            }}
            className={cn(
              'flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] font-semibold transition sm:text-[11px]',
              isTransactionActive(location.pathname) || mobileTransactionOpen ? 'text-accent' : 'text-muted'
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-xl transition sm:h-9 sm:w-9',
                isTransactionActive(location.pathname) || mobileTransactionOpen ? 'bg-accent-soft text-accent' : 'bg-transparent'
              )}
            >
              <ArrowLeftRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <span className="w-full truncate text-center">Transaksi</span>
          </button>

          <Link
            to={ROUTES.BUDGET}
            className={cn(
              'flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] font-semibold transition sm:text-[11px]',
              isPathActive(location.pathname, ROUTES.BUDGET) ? 'text-accent' : 'text-muted'
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-xl transition sm:h-9 sm:w-9',
                isPathActive(location.pathname, ROUTES.BUDGET) ? 'bg-accent-soft text-accent' : 'bg-transparent'
              )}
            >
              <PiggyBank className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <span className="w-full truncate text-center">Budget</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setQuickAddOpen(false);
              setMobileTransactionOpen(false);
              setMoreMenuOpen((open) => !open);
            }}
            className={cn(
              'flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] font-semibold transition sm:text-[11px]',
              moreMenuOpen || filteredMoreMenu.some((m) => isPathActive(location.pathname, m.path))
                ? 'text-accent'
                : 'text-muted'
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-xl transition sm:h-9 sm:w-9',
                moreMenuOpen || filteredMoreMenu.some((m) => isPathActive(location.pathname, m.path))
                  ? 'bg-accent-soft text-accent'
                  : 'bg-transparent'
              )}
            >
              <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <span className="w-full truncate text-center">Lainnya</span>
          </button>
        </div>
      </nav>

      <ProWelcomeTour
        isOpen={proWelcomeOpen}
        userId={user?.id}
        userName={user?.name}
        onClose={() => setProWelcomeOpen(false)}
      />
    </div>
  );
}
