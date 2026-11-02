import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Shield, ShieldOff, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { Card, Button, Modal, ModalFooter, Badge, Input } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { formatDate, cn } from '@/lib/utils';
import { GENDER_OPTIONS, type Gender } from '@/lib/gender';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  currency: string;
  gender?: Gender | null;
  birthDate?: string | null;
  createdAt: string;
  _count: { expenses: number; savingsGoals: number; budgets: number };
}

type EditForm = {
  name: string;
  email: string;
  currency: string;
  gender: Gender | '';
  birthDate: string;
  role: 'USER' | 'ADMIN';
};

const CURRENCIES = [
  { code: 'IDR', label: 'Rupiah (IDR)' },
  { code: 'USD', label: 'US Dollar (USD)' },
] as const;

function UserActions({
  user,
  rolePending,
  onEdit,
  onToggleRole,
  onDelete,
}: {
  user: AdminUser;
  rolePending: boolean;
  onEdit: () => void;
  onToggleRole: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onEdit}
        className="rounded-lg p-1.5 text-muted transition hover:bg-accent-soft hover:text-accent"
        title="Edit user"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        disabled={rolePending}
        onClick={onToggleRole}
        className="rounded-lg p-1.5 text-muted transition hover:bg-violet-100 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
        title={user.role === 'ADMIN' ? 'Jadikan User' : 'Jadikan Admin'}
      >
        {rolePending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : user.role === 'ADMIN' ? (
          <ShieldOff className="h-4 w-4" />
        ) : (
          <Shield className="h-4 w-4" />
        )}
      </button>
      <button
        onClick={onDelete}
        className="rounded-lg p-1.5 text-muted transition hover:bg-coral-soft hover:text-coral"
        title="Hapus user"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function birthBounds() {
  const min = new Date();
  min.setFullYear(min.getFullYear() - 120);
  const max = new Date();
  max.setFullYear(max.getFullYear() - 10);
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { min: ymd(min), max: ymd(max) };
}

export function AdminUsers() {
  const toast = useToast();
  const qc = useQueryClient();
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const birth = birthBounds();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data.data as AdminUser[];
    },
  });

  useEffect(() => {
    if (!editUser) {
      setForm(null);
      return;
    }
    setForm({
      name: editUser.name,
      email: editUser.email,
      currency: editUser.currency || 'IDR',
      gender: editUser.gender === 'MALE' || editUser.gender === 'FEMALE' ? editUser.gender : '',
      birthDate: editUser.birthDate || '',
      role: editUser.role === 'ADMIN' ? 'ADMIN' : 'USER',
    });
  }, [editUser]);

  const roleMut = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      await api.patch(`/admin/users/${id}/role`, { role });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Role diperbarui');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Gagal update role'),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const res = await api.patch(`/admin/users/${id}`, payload);
      return res.data.data as AdminUser;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Data user diperbarui');
      setEditUser(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Gagal menyimpan data user'),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success('User dihapus');
      setDeleteUser(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Gagal hapus user'),
  });

  const submitEdit = () => {
    if (!editUser || !form) return;
    const name = form.name.trim();
    const email = form.email.trim();
    if (name.length < 2) {
      toast.error('Nama minimal 2 karakter');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Email tidak valid');
      return;
    }
    if (!form.gender) {
      toast.error('Pilih jenis kelamin');
      return;
    }
    if (!form.birthDate) {
      toast.error('Tanggal lahir wajib diisi');
      return;
    }

    updateMut.mutate({
      id: editUser.id,
      payload: {
        name,
        email,
        currency: form.currency,
        gender: form.gender,
        birthDate: form.birthDate,
        role: form.role,
      },
    });
  };

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-extrabold text-ink">Kelola User</h1>
      <p className="mb-6 text-sm text-muted">{users.length} user terdaftar</p>

      {isLoading ? (
        <p className="text-muted">Memuat...</p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {users.map((u) => (
              <Card key={u.id} padding="md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{u.name}</p>
                    <p className="truncate text-xs text-muted">{u.email}</p>
                  </div>
                  <Badge variant={u.role === 'ADMIN' ? 'accent' : 'default'} size="sm">
                    {u.role}
                  </Badge>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-mist/60 px-2 py-2">
                    <dt className="text-[11px] text-muted">Transaksi</dt>
                    <dd className="font-semibold text-ink">{u._count.expenses}</dd>
                  </div>
                  <div className="rounded-xl bg-mist/60 px-2 py-2">
                    <dt className="text-[11px] text-muted">Savings</dt>
                    <dd className="font-semibold text-ink">{u._count.savingsGoals}</dd>
                  </div>
                  <div className="rounded-xl bg-mist/60 px-2 py-2">
                    <dt className="text-[11px] text-muted">Budget</dt>
                    <dd className="font-semibold text-ink">{u._count.budgets}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted">{formatDate(u.createdAt)}</span>
                  <UserActions
                    user={u}
                    rolePending={roleMut.isPending}
                    onEdit={() => setEditUser(u)}
                    onToggleRole={() =>
                      roleMut.mutate({
                        id: u.id,
                        role: u.role === 'ADMIN' ? 'USER' : 'ADMIN',
                      })
                    }
                    onDelete={() => setDeleteUser(u)}
                  />
                </div>
              </Card>
            ))}
          </div>

          <Card padding="none" className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-mist/40 text-left">
                    <th className="px-4 py-3 font-semibold text-muted">User</th>
                    <th className="px-4 py-3 font-semibold text-muted">Role</th>
                    <th className="px-4 py-3 font-semibold text-muted">Transaksi</th>
                    <th className="px-4 py-3 font-semibold text-muted">Savings</th>
                    <th className="px-4 py-3 font-semibold text-muted">Budget</th>
                    <th className="px-4 py-3 font-semibold text-muted">Daftar</th>
                    <th className="px-4 py-3 font-semibold text-muted">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-line last:border-0 hover:bg-mist/20">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">{u.name}</p>
                        <p className="text-xs text-muted">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.role === 'ADMIN' ? 'accent' : 'default'} size="sm">
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-ink">{u._count.expenses}</td>
                      <td className="px-4 py-3 text-ink">{u._count.savingsGoals}</td>
                      <td className="px-4 py-3 text-ink">{u._count.budgets}</td>
                      <td className="px-4 py-3 text-xs text-muted">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <UserActions
                          user={u}
                          rolePending={roleMut.isPending}
                          onEdit={() => setEditUser(u)}
                          onToggleRole={() =>
                            roleMut.mutate({
                              id: u.id,
                              role: u.role === 'ADMIN' ? 'USER' : 'ADMIN',
                            })
                          }
                          onDelete={() => setDeleteUser(u)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit User"
        size="md"
      >
        {form && (
          <div className="space-y-3">
            <Input
              label="Nama lengkap"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Jenis kelamin</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {GENDER_OPTIONS.map((opt) => {
                  const active = form.gender === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, gender: opt.value })}
                      className={cn(
                        'min-h-11 w-full rounded-2xl border px-3 py-2.5 text-center text-sm font-semibold transition',
                        active
                          ? 'border-accent bg-accent-soft text-accent'
                          : 'border-line bg-surface text-muted hover:border-accent/40'
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <Input
              label="Tanggal lahir"
              type="date"
              min={birth.min}
              max={birth.max}
              value={form.birthDate}
              onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
            />
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Mata uang</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CURRENCIES.map((item) => {
                  const active = form.currency === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setForm({ ...form, currency: item.code })}
                      className={cn(
                        'min-h-11 w-full rounded-2xl border px-3 py-2.5 text-center text-sm font-semibold transition',
                        active
                          ? 'border-accent bg-accent-soft text-accent'
                          : 'border-line bg-surface text-muted hover:border-accent/40'
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Role</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(['USER', 'ADMIN'] as const).map((role) => {
                  const active = form.role === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm({ ...form, role })}
                      className={cn(
                        'min-h-11 w-full rounded-2xl border px-3 py-2.5 text-center text-sm font-semibold transition',
                        active
                          ? 'border-accent bg-accent-soft text-accent'
                          : 'border-line bg-surface text-muted hover:border-accent/40'
                      )}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <ModalFooter>
          <Button variant="ghost" onClick={() => setEditUser(null)}>
            Batal
          </Button>
          <Button isLoading={updateMut.isPending} onClick={submitEdit}>
            Simpan
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={!!deleteUser} onClose={() => setDeleteUser(null)} title="Hapus User" size="sm">
        <p className="break-words text-muted">
          Hapus user <strong className="text-ink">{deleteUser?.name}</strong> ({deleteUser?.email})? Semua data akan terhapus permanen.
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setDeleteUser(null)}>Batal</Button>
          <Button variant="danger" isLoading={deleteMut.isPending} onClick={() => deleteUser && deleteMut.mutate(deleteUser.id)}>
            Hapus
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
