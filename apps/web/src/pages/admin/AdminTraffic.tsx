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

          <Card padding="md" className="mb-6">
            <p className="mb-4 text-sm font-semibold text-ink">Kunjungan harian</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.daily ?? []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-mist/40 text-left">
                  <th className="px-4 py-3 font-semibold text-muted">Path</th>
                  <th className="px-4 py-3 font-semibold text-muted">Kunjungan</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topPaths ?? []).length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-muted" colSpan={2}>
                      Belum ada data kunjungan.
                    </td>
                  </tr>
                ) : (
                  data!.topPaths.map((row) => (
                    <tr key={row.path} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-mono text-ink">{row.path}</td>
                      <td className="px-4 py-3 text-muted">{row.visits.toLocaleString('id-ID')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
