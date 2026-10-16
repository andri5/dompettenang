/**
 * Dompet Tenang - Reset Password Page
 */

import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthLayout, PageTransition } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { resetPasswordSchema } from '@/lib/validations';
import type { ResetPasswordFormData } from '@/lib/validations';
import { clearAuthData, resetPassword } from '@/services/auth.service';
import { useAuthStore } from '@/stores';
import { ROUTES } from '@/lib/constants';
import { authErrorMessage, AUTH_SAFE } from '@/lib/authErrors';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => {
    const fromQuery = searchParams.get('token')?.trim() || '';
    if (fromQuery) return fromQuery;
    // Some clients put params after #/...
    if (typeof window !== 'undefined' && window.location.hash.includes('token=')) {
      const hash = window.location.hash.replace(/^#/, '');
      const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : hash);
      return params.get('token')?.trim() || '';
    }
    return '';
  }, [searchParams]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError(AUTH_SAFE.resetInvalid);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await resetPassword(token, data.password);
      // Drop stale client session so /login is not bounced to dashboard
      clearAuthData();
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isBootstrapping: false,
        error: null,
      });
      setSuccess(true);
      setTimeout(() => navigate(ROUTES.LOGIN), 1800);
    } catch (err) {
      setError(authErrorMessage(err, AUTH_SAFE.resetInvalid));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <PageTransition>
        <AuthLayout title="Reset Password" subtitle="Tautan tidak valid">
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-2xl border border-coral/20 bg-coral-soft px-3 py-3 text-sm text-ink">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral" />
              <span>Token reset tidak ada atau rusak. Silakan ajukan ulang lupa password.</span>
            </div>
            <Link to={ROUTES.FORGOT_PASSWORD}>
              <Button variant="gradient" className="w-full">
                Ajukan Lupa Password
              </Button>
            </Link>
          </div>
        </AuthLayout>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <AuthLayout title="Password Baru" subtitle="Buat password baru untuk akunmu">
        {success ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-soft text-lime">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-ink">Password berhasil diubah</p>
              <p className="mt-1 text-sm text-muted">Mengalihkan ke halaman login...</p>
            </div>
            <Link to={ROUTES.LOGIN}>
              <Button variant="outline" className="w-full">
                Masuk Sekarang
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-2xl border border-coral/20 bg-coral-soft px-3 py-3 text-sm text-ink">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Password Baru"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 karakter (huruf + angka)"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted transition hover:text-ink"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Konfirmasi Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Ulangi password baru"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-muted transition hover:text-ink"
                  aria-label={
                    showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              variant="gradient"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Simpan Password Baru
            </Button>

            <p className="text-center text-sm text-muted">
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke login
              </Link>
            </p>
          </form>
        )}
      </AuthLayout>
    </PageTransition>
  );
}
