import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  ArrowLeft,
  Shield,
  Eye,
  Flag,
  ScrollText,
  FileText,
  Crown,
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { fetchProRequestsSummary } from '@/services/billing.service';

const NAV = [
  { icon: LayoutDashboard, label: 'Overview', short: 'Overview', path: ROUTES.ADMIN },
  { icon: Users, label: 'Users', short: 'Users', path: ROUTES.ADMIN_USERS },
  { icon: Crown, label: 'Pro', short: 'Pro', path: ROUTES.ADMIN_PRO, badgeKey: 'pro' as const },
  { icon: MessageSquare, label: 'Feedback', short: 'Feedback', path: ROUTES.ADMIN_FEEDBACK },
  { icon: Eye, label: 'Traffic', short: 'Traffic', path: ROUTES.ADMIN_TRAFFIC },
  { icon: Flag, label: 'Flags', short: 'Flags', path: ROUTES.ADMIN_FLAGS },
  { icon: ScrollText, label: 'Activity', short: 'Activity', path: ROUTES.ADMIN_ACTIVITY },
  { icon: FileText, label: 'Syarat & Ketentuan', short: 'Legal', path: ROUTES.ADMIN_LEGAL },
];

export function AdminLayout() {
  const user = useAuthStore((s) => s.user);

  const { data: proSummary } = useQuery({
    queryKey: ['admin', 'pro-requests', 'summary'],
    queryFn: fetchProRequestsSummary,
    enabled: Boolean(user && user.role === 'ADMIN'),
    refetchInterval: 30_000,
  });

  const proBadge = proSummary?.open ?? 0;

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="flex min-h-dvh min-w-0 overflow-x-clip bg-mist/40">
      <aside className="hidden w-60 flex-shrink-0 border-r border-line bg-surface p-4 lg:block">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-ink">Admin Panel</p>
            <p className="text-[11px] text-muted">Dompet Tenang</p>
          </div>
        </div>

        <nav className="space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.path}
              to={n.path}
              end={n.path === ROUTES.ADMIN}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                  isActive
                    ? 'bg-violet-100 text-violet-700'
                    : 'text-muted hover:bg-mist hover:text-ink'
                )
              }
            >
              <n.icon className="h-4 w-4" />
              <span className="flex-1">{n.label}</span>
              {n.badgeKey === 'pro' && proBadge > 0 ? (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {proBadge > 99 ? '99+' : proBadge}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8">
          <NavLink
            to={ROUTES.DASHBOARD}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-mist hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke App
          </NavLink>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-line bg-surface lg:hidden">
          <div className="flex items-center gap-2 px-3 py-3">
            <NavLink
              to={ROUTES.DASHBOARD}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-mist hover:text-ink"
              aria-label="Kembali ke aplikasi"
            >
              <ArrowLeft className="h-4 w-4" />
            </NavLink>
            <Shield className="h-4 w-4 shrink-0 text-violet-600" />
            <span className="min-w-0 truncate font-display text-sm font-bold">Admin Panel</span>
          </div>
          <nav className="grid grid-cols-4 gap-1.5 px-3 pb-3">
            {NAV.map((n) => (
              <NavLink
                key={n.path}
                to={n.path}
                end={n.path === ROUTES.ADMIN}
                className={({ isActive }) =>
                  cn(
                    'flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-center text-[11px] font-semibold leading-tight transition',
                    isActive ? 'bg-violet-100 text-violet-700' : 'text-muted'
                  )
                }
              >
                <span className="relative">
                  <n.icon className="h-4 w-4" />
                  {n.badgeKey === 'pro' && proBadge > 0 ? (
                    <span className="absolute -right-2 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {proBadge > 99 ? '99+' : proBadge}
                    </span>
                  ) : null}
                </span>
                <span className="w-full truncate">{n.short}</span>
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="min-w-0 flex-1 p-3 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
