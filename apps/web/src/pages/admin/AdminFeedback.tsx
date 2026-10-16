import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Trash2, MessageSquare, Globe2 } from 'lucide-react';
import api from '@/lib/api';
import { Card, EmptyState } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { formatDate, cn } from '@/lib/utils';

interface FeedbackItem {
  id: string;
  name: string | null;
  message: string;
  rating: number;
  isPublished: boolean;
  createdAt: string;
}

export function AdminFeedback() {
  const toast = useToast();
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin', 'feedback'],
    queryFn: async () => {
      const res = await api.get('/admin/feedback');
      return res.data.data as FeedbackItem[];
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/feedback/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'feedback'] });
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Feedback dihapus');
    },
  });

  const publishMut = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      await api.patch(`/admin/feedback/${id}`, { isPublished });
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'feedback'] });
      qc.invalidateQueries({ queryKey: ['landing', 'testimonials'] });
      toast.success(
        vars.isPublished ? 'Ditampilkan di landing page' : 'Disembunyikan dari landing page'
      );
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message || 'Gagal mengubah status publish'),
  });

  const rated = items.filter((f) => f.rating > 0);
  const avgRating =
    rated.length > 0
      ? (rated.reduce((s, f) => s + f.rating, 0) / rated.length).toFixed(1)
      : '0';
  const publishedCount = items.filter((f) => f.isPublished).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 font-display text-2xl font-extrabold text-ink">Feedback</h1>
          <p className="text-sm text-muted">
            {items.length} masukan · {publishedCount} dipublish ke landing
          </p>
        </div>
        {items.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-accent-soft px-3 py-2">
              <Globe2 className="h-4 w-4 text-accent" />
              <span className="text-sm font-bold text-accent">{publishedCount} di landing</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-amber-700">Rata-rata {avgRating}/5</span>
            </div>
          </div>
        )}
      </div>

      <p className="mb-4 rounded-2xl border border-line bg-mist/40 px-4 py-3 text-sm text-muted">
        Centang <span className="font-semibold text-ink">Tampil di landing</span> untuk menampilkan
        masukan sebagai testimoni di halaman beranda. Hanya feedback yang dipublish yang terlihat
        publik.
      </p>

      {isLoading ? (
        <p className="text-muted">Memuat...</p>
      ) : items.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<MessageSquare className="h-7 w-7" />}
            title="Belum ada feedback"
            description="Feedback dari landing page, web settings, dan mobile akan muncul di sini"
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <Card
              key={f.id}
              padding="md"
              className={cn(
                'relative',
                f.isPublished && 'ring-2 ring-accent/30'
              )}
            >
              <button
                type="button"
                onClick={() => deleteMut.mutate(f.id)}
                disabled={deleteMut.isPending}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-muted transition hover:bg-coral-soft hover:text-coral"
                aria-label="Hapus feedback"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              {f.rating > 0 && (
                <div className="mb-2 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < f.rating ? 'fill-amber-400 text-amber-400' : 'text-line'
                      }`}
                    />
                  ))}
                </div>
              )}

              <p className="mb-3 pr-8 text-sm leading-relaxed text-ink">"{f.message}"</p>

              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-muted">{f.name || 'Anonim'}</p>
                <p className="text-[11px] text-muted">{formatDate(f.createdAt)}</p>
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-mist/50 px-3 py-2">
                <span className="text-xs font-semibold text-ink">Tampil di landing</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={f.isPublished}
                  disabled={publishMut.isPending}
                  onClick={() =>
                    publishMut.mutate({ id: f.id, isPublished: !f.isPublished })
                  }
                  className={cn(
                    'relative h-6 w-11 shrink-0 rounded-full transition',
                    f.isPublished ? 'bg-accent' : 'bg-mist-deep'
                  )}
                >
                  <span
                    className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition"
                    style={{ left: f.isPublished ? '1.25rem' : '0.125rem' }}
                  />
                </button>
              </label>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
