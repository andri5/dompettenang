import { useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import api from '@/lib/api';
import { Card, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface AuditItem {
  id: string;
  userId: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  createdAt: string;
}

export function AdminActivity() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: async () => {
      const res = await api.get('/admin/activity', { params: { take: 100 } });
      return res.data.data as AuditItem[];
    },
  });

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-extrabold text-ink">Activity Log</h1>
      <p className="mb-6 text-sm text-muted">Jejak aksi penting di aplikasi.</p>

      {isLoading ? (
        <p className="text-muted">Memuat...</p>
      ) : logs.length === 0 ? (
        <Card padding="md">
          <div className="flex items-center gap-3 text-muted">
            <ScrollText className="h-5 w-5" />
            <p className="text-sm">Belum ada aktivitas tercatat.</p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-mist/40 text-left">
                  <th className="px-4 py-3 font-semibold text-muted">Waktu</th>
                  <th className="px-4 py-3 font-semibold text-muted">Aksi</th>
                  <th className="px-4 py-3 font-semibold text-muted">Ringkasan</th>
                  <th className="px-4 py-3 font-semibold text-muted">Role</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-line last:border-0 hover:bg-mist/20">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="default" size="sm">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-ink">{log.summary}</td>
                    <td className="px-4 py-3 text-muted">{log.actorRole || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
