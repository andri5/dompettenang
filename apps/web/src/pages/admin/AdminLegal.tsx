import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Save } from 'lucide-react';
import api from '@/lib/api';
import { Button, Card, Input } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

type LegalKey = 'terms' | 'privacy';

type LegalDocument = {
  key: LegalKey;
  title: string;
  body: string;
  updatedAt: string;
};

const TABS: { key: LegalKey; label: string }[] = [
  { key: 'terms', label: 'Syarat & Ketentuan' },
  { key: 'privacy', label: 'Kebijakan Privasi' },
];

export function AdminLegal() {
  const toast = useToast();
  const qc = useQueryClient();
  const [active, setActive] = useState<LegalKey>('terms');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['admin', 'legal'],
    queryFn: async () => {
      const res = await api.get('/admin/legal');
      return res.data.data as LegalDocument[];
    },
  });

  const current = useMemo(
    () => docs.find((d) => d.key === active) ?? null,
    [docs, active]
  );

  useEffect(() => {
    if (!current) return;
    setTitle(current.title);
    setBody(current.body);
  }, [current?.key, current?.updatedAt]);

  const saveMut = useMutation({
    mutationFn: async () => {
      await api.put(`/admin/legal/${active}`, { title, body });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'legal'] });
      qc.invalidateQueries({ queryKey: ['legal', active] });
      toast.success('Dokumen legal disimpan');
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message || 'Gagal menyimpan dokumen'),
  });

  const dirty =
    !!current && (title.trim() !== current.title || body.trim() !== current.body);

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-extrabold text-ink">
        Syarat & Ketentuan
      </h1>
      <p className="mb-6 text-sm text-muted">
        Kelola teks legal yang tampil di halaman publik (web & mobile). Pisahkan paragraf dengan
        baris kosong.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              'rounded-xl px-3.5 py-2 text-sm font-semibold transition',
              active === tab.key
                ? 'bg-violet-100 text-violet-700'
                : 'bg-surface text-muted hover:bg-mist'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted">Memuat...</p>
      ) : (
        <Card padding="md">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">
                {TABS.find((t) => t.key === active)?.label}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-muted">key: {active}</p>
              {current?.updatedAt && (
                <p className="mt-1 text-xs text-muted">
                  Terakhir diperbarui:{' '}
                  {new Date(current.updatedAt).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Input
              label="Judul"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul dokumen"
            />
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Isi dokumen</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={14}
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                placeholder="Tulis isi syarat & ketentuan…&#10;&#10;Pisahkan tiap paragraf dengan baris kosong."
              />
              <p className="mt-1.5 text-xs text-muted">{body.trim().length} karakter</p>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="gradient"
                size="md"
                leftIcon={<Save className="h-4 w-4" />}
                disabled={!dirty || saveMut.isPending || title.trim().length < 3 || body.trim().length < 20}
                isLoading={saveMut.isPending}
                onClick={() => saveMut.mutate()}
              >
                Simpan perubahan
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
