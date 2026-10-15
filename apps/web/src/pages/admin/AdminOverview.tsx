import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Receipt,
  MessageSquare,
  Target,
  UserPlus,
  Eye,
  Activity,
  Crown,
} from 'lucide-react';
import api from '@/lib/api';
import { Card, Badge } from '@/components/ui';
import { ROUTES } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

interface Stats {
  users: number;
  transactions: number;
  feedback: number;
  savingsGoals: number;
  todayUsers: number;
  proOpen?: number;
  proProofSubmitted?: number;
}

interface TrafficData {
  totalVisits: number;
  uniqueVisitorsInRange: number;
  activeUsersToday: number;
}

interface AuditItem {
  id: string;
  action: string;
  summary: string;
  actorRole: string | null;
  createdAt: string;
}

export function AdminOverview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data.data as Stats;
    },
    retry: 1,
  });

  const { data: traffic } = useQuery({
    queryKey: ['admin', 'traffic'],
    queryFn: async () => {
      const res = await api.get('/admin/traffic', { params: { days: 7 } });
      return res.data.data as TrafficData;
    },
    retry: 1,
  });

  const { data: activity = [] } = useQuery({
    queryKey: ['admin', 'activity', 'preview'],
    queryFn: async () => {
      const res = await api.get('/admin/activity', { params: { take: 8 } });
      return res.data.data as AuditItem[];
    },
    retry: 1,
  });

  const cards = [
    { label: 'Total Users', value: data?.users ?? 0, icon: Users, tone: 'bg-violet-100 text-violet-600' },
    { label: 'User Baru Hari Ini', value: data?.todayUsers ?? 0, icon: UserPlus, tone: 'bg-lime-100 text-lime-600' },
    { label: 'Total Transaksi', value: data?.transactions ?? 0, icon: Receipt, tone: 'bg-accent-soft text-accent' },
    { label: 'Target Tabungan', value: data?.savingsGoals ?? 0, icon: Target, tone: 'bg-amber-100 text-amber-600' },
    { label: 'Feedback Masuk', value: data?.feedback ?? 0, icon: MessageSquare, tone: 'bg-cyan-100 text-cyan-600' },
    {
      label: 'Visitor Aktif Hari Ini',
      value: traffic?.activeUsersToday ?? 0,
      icon: Eye,
      tone: 'bg-fuchsia-100 text-fuchsia-600',
    },
    {
      label: 'Pro Request Terbuka',
      value: data?.proOpen ?? 0,
      icon: Crown,
      tone: 'bg-amber-100 text-amber-700',
      href: ROUTES.ADMIN_PRO,
      hint:
        (data?.proProofSubmitted ?? 0) > 0
          ? `${data?.proProofSubmitted} perlu review bukti`
          : undefined,
    },
  ];

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-extrabold text-ink">Overview</h1>
      <p className="mb-6 text-sm text-muted">Ringkasan statistik Dompet Tenang</p>

      {isLoading ? (
        <p className="text-muted">Memuat...</p>
      ) : error ? (
        <Card padding="md">
          <p className="text-sm text-coral">Gagal memuat data admin. Pastikan kamu login ulang sebagai ADMIN.</p>
        </Card>
      ) : (
        <>
          {(data?.proProofSubmitted ?? 0) > 0 ? (
            <Link
              to={ROUTES.ADMIN_PRO}
              className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 transition hover:bg-violet-100"
            >
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-violet-700" />
                <p className="text-sm font-semibold text-violet-800">
                  {data?.proProofSubmitted} permintaan Pro menunggu review bukti transfer
                </p>
              </div>
              <span className="text-xs font-bold text-violet-700">Buka →</span>
            </Link>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => {
              const inner = (
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.tone}`}>
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted">{c.label}</p>
                    <p className="font-display text-xl font-extrabold text-ink">
                      {c.value.toLocaleString('id-ID')}
                    </p>
                    {'hint' in c && c.hint ? (
                      <p className="text-[11px] font-medium text-violet-600">{c.hint}</p>
                    ) : null}
                  </div>
                </div>
              );
              return (
                <Card key={c.label} padding="md">
                  {'href' in c && c.href ? (
                    <Link to={c.href} className="block">
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </Card>
              );
            })}
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-violet-600" />
                <h2 className="font-display text-lg font-bold text-ink">Aktivitas terbaru</h2>
              </div>
              <Link to={ROUTES.ADMIN_ACTIVITY} className="text-sm font-semibold text-violet-600 hover:underline">
                Lihat semua
              </Link>
            </div>
            <Card padding="none">
              {activity.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted">Belum ada aktivitas.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {activity.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <Badge variant="default" size="sm">
                            {item.action}
                          </Badge>
                          {item.actorRole && (
                            <span className="text-[11px] text-muted">{item.actorRole}</span>
                          )}
                        </div>
                        <p className="text-sm text-ink">{item.summary}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted">{formatDate(item.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
