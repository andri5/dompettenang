/**
 * Dompet Tenang - Settings Page
 */

import { useEffect, useRef, useState } from 'react';
import {
  User,
  Mail,
  Calendar,
  LogOut,
  Shield,
  Camera,
  Loader2,
  Check,
  Lock,
  Eye,
  EyeOff,
  MessageSquare,
  Send,
  Star,
  Crown,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout, PageHeader, PageTransition } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, Badge, UserAvatar, Input } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { useAuthStore, useUIStore } from '@/stores';
import { ROUTES, THEME_OPTIONS, type AppTheme } from '@/lib/constants';
import { formatDate, cn } from '@/lib/utils';
import { uploadAvatar } from '@/services/upload.service';
import api from '@/lib/api';
import { updateProfile, changePassword } from '@/services/auth.service';
import { authErrorMessage, AUTH_SAFE } from '@/lib/authErrors';
import { GENDER_OPTIONS, type Gender } from '@/lib/gender';
import { hasProAccess } from '@/lib/plan';

const CURRENCIES = [
  { code: 'IDR' as const, label: 'Rupiah', hint: 'Indonesia', symbol: 'Rp' },
  { code: 'USD' as const, label: 'US Dollar', hint: 'United States', symbol: '$' },
] as const;

const themePreview: Record<AppTheme, { from: string; to: string; accent: string }> = {
  neo: { from: '#f3f6f9', to: '#ffffff', accent: '#0f9b8e' },
  midnight: { from: '#0b1118', to: '#151e2a', accent: '#1cc8b4' },
  ocean: { from: '#eef6fa', to: '#ffffff', accent: '#0e7490' },
};

export function SettingsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, logout, setUser } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const savingPasswordRef = useRef(false);
  const sendingFeedbackRef = useRef(false);
  const [isUploading, setIsUploading] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'IDR');
  const [gender, setGender] = useState<Gender | ''>(user?.gender || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState<boolean | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [sendingFeedback, setSendingFeedback] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      const next = (user.currency || 'IDR').toUpperCase().slice(0, 3);
      setCurrency(next === 'USD' ? 'USD' : 'IDR');
      setGender(user.gender === 'MALE' || user.gender === 'FEMALE' ? user.gender : '');
      setBirthDate(user.birthDate || '');
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    if (!user || user.role === 'ADMIN') {
      setFeedbackVisible(false);
      return () => {
        cancelled = true;
      };
    }

    setFeedbackVisible(null);
    api
      .get('/feedback/status')
      .then((res) => {
        if (!cancelled) {
          setFeedbackVisible(!Boolean(res.data?.data?.submitted));
        }
      })
      .catch(() => {
        if (!cancelled) setFeedbackVisible(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const handleAvatarChange = async (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diizinkan');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadAvatar(file);
      setUser({
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        avatar: result.user.avatar,
        currency: result.user.currency,
        createdAt: String(result.user.createdAt),
        updatedAt: result.user.updatedAt
          ? String(result.user.updatedAt)
          : undefined,
      });
      toast.success('Foto profil berhasil diperbarui');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengunggah foto profil');
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error('Nama minimal 2 karakter');
      return;
    }
    if (!gender) {
      toast.error('Pilih jenis kelamin');
      return;
    }
    if (!birthDate) {
      toast.error('Isi tanggal lahir');
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await updateProfile({
        name: name.trim(),
        currency: currency === 'USD' ? 'USD' : 'IDR',
        gender,
        birthDate,
      });
      setUser(updated);
      toast.success('Profil diperbarui');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan profil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingPasswordRef.current) return;
    const isStrongPassword = (pwd: string) => {
      return pwd.length >= 8 && /[A-Za-z]/.test(pwd) && /\d/.test(pwd);
    };
    if (!isStrongPassword(newPassword)) {
      toast.error('Password baru minimal 8 karakter dan mengandung huruf serta angka');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }
    savingPasswordRef.current = true;
    setSavingPassword(true);
    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
      });
      toast.success(result.message || 'Password berhasil diubah');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      toast.error(authErrorMessage(err, AUTH_SAFE.changePasswordFailed));
    } finally {
      setSavingPassword(false);
      savingPasswordRef.current = false;
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendingFeedbackRef.current) return;
    if (!feedbackMessage.trim()) {
      toast.error('Tulis saran atau masukan dulu ya.');
      return;
    }

    sendingFeedbackRef.current = true;
    setSendingFeedback(true);
    try {
      await api.post('/feedback', {
        name: user?.name?.trim() || null,
        message: feedbackMessage.trim(),
        rating: feedbackRating,
      });
      toast.success('Suaramu sudah sampai ke tim kami. Dompet Tenang makin baik berkat masukanmu.');
      setFeedbackVisible(false);
      setFeedbackMessage('');
      setFeedbackRating(0);
      setHoverRating(0);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.success('Kamu sudah pernah kirim saran. Terima kasih ya!');
        setFeedbackVisible(false);
      } else {
        toast.error(err?.response?.data?.message || 'Gagal mengirim masukan');
      }
    } finally {
      setSendingFeedback(false);
      sendingFeedbackRef.current = false;
    }
  };

  const moveThemePasswordToRight = feedbackVisible === false;

  const themeCard = (
    <Card padding="md">
      <CardHeader>
        <CardTitle>Tema Aplikasi</CardTitle>
      </CardHeader>
      <p className="mb-3 text-sm text-muted">Pilih salah satu dari 3 tema tampilan.</p>
      <div className="grid gap-2.5 sm:grid-cols-3">
        {THEME_OPTIONS.map((option) => {
          const preview = themePreview[option.id];
          const selected = theme === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setTheme(option.id);
                toast.success(`Tema ${option.name} aktif`);
              }}
              className={cn(
                'rounded-2xl border p-3 text-left transition',
                selected
                  ? 'border-accent ring-2 ring-accent/25'
                  : 'border-line hover:border-accent/40'
              )}
            >
              <div
                className="mb-2.5 flex h-14 items-end justify-between overflow-hidden rounded-xl px-2.5 pb-2"
                style={{
                  background: `linear-gradient(145deg, ${preview.from}, ${preview.to})`,
                }}
              >
                <span
                  className="h-6 w-6 rounded-lg shadow-sm"
                  style={{ backgroundColor: preview.accent }}
                />
                {selected && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-ink">{option.name}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted">{option.description}</p>
            </button>
          );
        })}
      </div>
      <div className="mt-4 border-t border-line pt-4">
        <p className="mb-2 text-sm font-semibold text-ink">Tentang Aplikasi</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-muted">Nama</span>
            <span className="font-semibold text-ink">Dompet Tenang</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">Versi</span>
            <span className="font-semibold text-ink">1.0.0</span>
          </div>
        </div>
      </div>
    </Card>
  );

  const passwordCard = (
    <Card padding="md">
      <CardHeader>
        <CardTitle>Ganti Password</CardTitle>
      </CardHeader>
      <form onSubmit={handleChangePassword} className="space-y-3">
        <Input
          label="Password saat ini"
          type={showCurrentPassword ? 'text' : 'password'}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={
            <button
              type="button"
              className="text-muted transition hover:text-ink"
              aria-label={showCurrentPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              onClick={() => setShowCurrentPassword((v) => !v)}
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
          autoComplete="current-password"
        />
        <Input
          label="Password baru"
          type={showNewPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={
            <button
              type="button"
              className="text-muted transition hover:text-ink"
              aria-label={showNewPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              onClick={() => setShowNewPassword((v) => !v)}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
          autoComplete="new-password"
        />
        <Input
          label="Konfirmasi password baru"
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={
            <button
              type="button"
              className="text-muted transition hover:text-ink"
              aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              onClick={() => setShowConfirmPassword((v) => !v)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
          autoComplete="new-password"
        />
        <Button type="submit" variant="outline" className="w-full" isLoading={savingPassword}>
          Ubah Password
        </Button>
      </form>
    </Card>
  );

  return (
    <PageTransition>
      <MainLayout>
        <PageHeader
          eyebrow="Akun"
          title="Pengaturan"
          description="Kelola profil dan preferensi aplikasi."
        />

        <Card padding="md" className="mb-5 overflow-hidden">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="relative">
              <UserAvatar
                name={user?.name}
                avatar={user?.avatar}
                size="xl"
                className="shadow-lg shadow-accent/20"
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleAvatarChange(e.target.files?.[0])}
              />
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shadow-md ring-2 ring-surface transition hover:brightness-95 disabled:opacity-60"
                aria-label="Unggah foto profil"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                  {user?.name}
                </h2>
                {hasProAccess(user) ? (
                  <Badge variant="success" className="align-middle">
                    Pro
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="align-middle">
                    Free
                  </Badge>
                )}
                {user?.role === 'ADMIN' ? (
                  <Badge variant="info" className="align-middle">
                    Admin
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-muted">{user?.email}</p>
              {hasProAccess(user) && user?.role === 'ADMIN' ? (
                <p className="mt-1 text-xs font-medium text-accent">
                  Admin otomatis mendapat akses Pro tanpa berlangganan.
                </p>
              ) : null}
              {!hasProAccess(user) ? (
                <Link
                  to={ROUTES.UPGRADE}
                  className="mt-3 block max-w-md rounded-2xl border border-line bg-mist/50 px-3 py-2.5 transition hover:border-accent/40 hover:bg-accent-soft/40"
                >
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                    <Crown className="h-4 w-4 text-accent" />
                    Dompet Tenang Pro
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Tabungan, transaksi otomatis, PDF & bagikan laporan — sekali bayar. Lihat
                    detail →
                  </span>
                </Link>
              ) : null}
              {user?.createdAt && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted">
                  <Calendar className="h-4 w-4" />
                  Bergabung sejak {formatDate(user.createdAt)}
                </p>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                leftIcon={<Camera className="h-4 w-4" />}
                isLoading={isUploading}
                onClick={() => fileRef.current?.click()}
              >
                {user?.avatar ? 'Ganti Foto' : 'Unggah Foto'}
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Card padding="md">
              <CardHeader>
                <CardTitle>Edit Profil</CardTitle>
              </CardHeader>
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <Input
                  label="Nama Lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftIcon={<User className="h-4 w-4" />}
                />
                <div>
                  <p className="mb-2 text-sm font-medium text-ink">Jenis kelamin</p>
                  <div className="grid grid-cols-2 gap-2">
                    {GENDER_OPTIONS.map((opt) => {
                      const active = gender === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setGender(opt.value)}
                          className={cn(
                            'rounded-2xl border px-2 py-2.5 text-center text-xs font-semibold transition sm:text-sm',
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
                  min={(() => {
                    const d = new Date();
                    d.setFullYear(d.getFullYear() - 120);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  })()}
                  max={(() => {
                    const d = new Date();
                    d.setFullYear(d.getFullYear() - 10);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  })()}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
                <div className="flex items-center gap-3 rounded-2xl bg-mist/70 p-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted">Email</p>
                    <p className="truncate font-semibold text-ink">{user?.email}</p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-ink">Mata uang</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CURRENCIES.map((item) => {
                      const active = currency === item.code;
                      return (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => setCurrency(item.code)}
                          className={cn(
                            'rounded-2xl border px-3 py-3 text-left transition',
                            active
                              ? 'border-accent bg-accent-soft shadow-sm shadow-accent/15'
                              : 'border-line bg-surface text-muted hover:border-accent/40'
                          )}
                        >
                          <p
                            className={cn(
                              'font-display text-lg font-bold',
                              active ? 'text-accent' : 'text-ink'
                            )}
                          >
                            {item.symbol} {item.code}
                          </p>
                          <p className={cn('text-xs font-semibold', active ? 'text-accent' : 'text-muted')}>
                            {item.label}
                          </p>
                          <p className="text-[11px] text-muted">{item.hint}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-mist/70 p-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-soft text-lime">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Status Akun</p>
                    <Badge variant="success" size="sm" className="mt-1">
                      Aktif
                    </Badge>
                  </div>
                </div>
                <Button type="submit" variant="gradient" className="w-full" isLoading={savingProfile}>
                  Simpan Profil
                </Button>
              </form>
            </Card>

            {!moveThemePasswordToRight ? themeCard : null}
            {!moveThemePasswordToRight ? passwordCard : null}
          </div>

          <div className="space-y-4">
            {feedbackVisible ? (
              <Card padding="md">
                <CardHeader>
                  <CardTitle>Saran & Masukan</CardTitle>
                </CardHeader>
                <p className="mb-3 text-sm text-muted">
                  Bantu kami jadi lebih baik. Form ini hanya bisa dikirim satu kali per akun.
                </p>
                <form onSubmit={handleSubmitFeedback} className="space-y-3">
                  <div>
                    <p className="mb-2 text-sm font-medium text-ink">Beri penilaian</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onMouseEnter={() => setHoverRating(value)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setFeedbackRating(value)}
                          className="rounded-xl p-1 transition hover:scale-110"
                        >
                          <Star
                            className={cn(
                              'h-5 w-5 transition',
                              value <= (hoverRating || feedbackRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-line'
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-line bg-mist/60 p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
                      <MessageSquare className="h-4 w-4 text-accent" />
                      Saran atau masukan
                    </div>
                    <textarea
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      placeholder="Tulis saran, kritik, atau fitur yang kamu harapkan..."
                      rows={4}
                      className="w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent/40"
                      disabled={sendingFeedback}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="gradient"
                    className="w-full"
                    isLoading={sendingFeedback}
                    rightIcon={<Send className="h-4 w-4" />}
                  >
                    Kirim Masukan
                  </Button>
                </form>
              </Card>
            ) : null}

            {moveThemePasswordToRight ? themeCard : null}
            {moveThemePasswordToRight ? passwordCard : null}

            <Button
              variant="danger"
              className="w-full"
              leftIcon={<LogOut className="h-4 w-4" />}
              onClick={handleLogout}
            >
              Keluar dari Akun
            </Button>
          </div>
        </div>
      </MainLayout>
    </PageTransition>
  );
}
