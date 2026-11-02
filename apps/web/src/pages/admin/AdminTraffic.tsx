import { useQuery } from '@tanstack/react-query';
import { Eye, Users, MousePointerClick } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '@/lib/api';
import { Card } from '@/components/ui';

interface TrafficData {
  totalVisits: number;
  uniqueVisitorsInRange: number;
  activeUsersToday: number;
  daily: Array<{ date: string; visits: number }>;
  topPaths: Array<{ path: string; visits: number }>;
}

export function AdminTraffic() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'traffic'],
    queryFn: async () => {
      const res = await api.get('/admin/traffic', { params: { days: 7 } });
      return res.data.data as TrafficData;
    },
  });

  const cards = [
    {
      label: 'Kunjungan 7 hari',
      value: data?.totalVisits ?? 0,
      icon: Eye,
      tone: 'bg-cyan-100 text-cyan-600',
    },
    {
      label: 'Visitor unik',
      value: data?.uniqueVisitorsInRange ?? 0,
      icon: Users,
      tone: 'bg-violet-100 text-violet-600',
    },
    {
      label: 'Aktif hari ini',
      value: data?.activeUsersToday ?? 0,
      icon: MousePointerClick,
      tone: 'bg-lime-100 text-lime-600',
    },
  ];

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-extrabold text-ink">Traffic</h1>
      <p className="mb-6 text-sm text-muted">Kunjungan halaman 7 hari terakhir.</p>

      {isLoading ? (
        <p className="text-muted">Memuat...</p>
      ) : error ? (
        <Card padding="md">
          <p className="text-sm text-coral">Gagal memuat data traffic.</p>
        </Card>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {cards.map((c) => (
              <Card key={c.label} padding="md">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.tone}`}>
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted">{c.label}</p>
                    <p className="font-display text-xl font-extrabold text-ink">
                      {c.value.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card padding="md" className="mb-6 overflow-hidden">
            <p className="mb-4 text-sm font-semibold text-ink">Kunjungan harian</p>
            <div className="h-56 w-full min-w-0 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.daily ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value: string) => {
                      const parts = String(value).split('-');
                      return parts.length === 3 ? `${parts[2]}/${parts[1]}` : String(value);
                    }}
                    interval={0}
                  />
                  <YAxis width={28} allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="visits" name="Kunjungan" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card padding="none">
            <div className="border-b border-line px-4 py-3">
              <p className="text-sm font-semibold text-ink">Halaman terpopuler</p>
            </div>
            {(data?.topPaths ?? []).length === 0 ? (
              <p className="px-4 py-4 text-sm text-muted">Belum ada data kunjungan.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data!.topPaths.map((row) => (
                  <li key={row.path} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="min-w-0 break-all font-mono text-xs text-ink sm:text-sm">{row.path}</span>
                    <span className="shrink-0 text-sm text-muted">{row.visits.toLocaleString('id-ID')}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
