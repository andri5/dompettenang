/**
 * Dompet Tenang - Register Page (compact)
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, User, AlertCircle } from 'lucide-react';
import { AuthLayout, PageTransition } from '@/components/layout';
import { TurnstileWidget } from '@/components/auth';
import { Button, Input } from '@/components/ui';
import { registerSchema } from '@/lib/validations';
import type { RegisterFormData } from '@/lib/validations';
import { useAuthStore } from '@/stores';
import { useToast } from '@/hooks/useToast';
import { useCaptchaConfig } from '@/hooks/useCaptchaConfig';
import { ROUTES } from '@/lib/constants';
import { SEO } from '@/components/SEO';
import { authErrorMessage, AUTH_SAFE } from '@/lib/authErrors';
import { GENDER_OPTIONS } from '@/lib/gender';
import { markWelcomePending } from '@/lib/welcome';
import { cn } from '@/lib/utils';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const toast = useToast();
  const { data: captcha, isLoading: captchaLoading, isError: captchaFetchError } =
    useCaptchaConfig();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  const captchaRequired = Boolean(captcha?.enabled && captcha.siteKey);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const selectedGender = watch('gender');

  const onSubmit = async (data: RegisterFormData) => {
    if (!termsAccepted) {
      toast.warning('Silakan setujui Syarat & Ketentuan');
      return;
    }
    if (captchaRequired && !captchaToken) {
      toast.warning('Selesaikan verifikasi captcha dulu');
      return;
    }

    setError(null);
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        gender: data.gender,
        birthDate: data.birthDate,
        ...(captchaToken ? { captchaToken } : {}),
      });
      markWelcomePending();
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      const errorMessage = authErrorMessage(err, AUTH_SAFE.registerFailed);
      setError(errorMessage);
      toast.error(errorMessage);
      setCaptchaToken(null);
      setCaptchaReset((n) => n + 1);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Za-z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    if (pwd.length >= 12) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthColors = [
    'bg-coral',
    'bg-orange-500',
    'bg-amber',
    'bg-lime-500',
    'bg-lime',
  ];

  const birthMax = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 10);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();
  const birthMin = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 120);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  return (
    <PageTransition>
      <SEO
        title="Daftar"
        description="Buat akun Dompet Tenang gratis. Mulai catat keuangan pribadimu sekarang."
        canonical="/register"
      />
      <AuthLayout compact title="Buat akun" subtitle="Gratis · siap dipakai dalam hitungan detik">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-coral/20 bg-coral-soft px-2.5 py-2 text-xs text-ink">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-coral" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Nama"
            type="text"
            placeholder="Nama lengkap"
            leftIcon={<User className="h-3.5 w-3.5" />}
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Email"
            type="email"
            placeholder="nama@email.com"
            leftIcon={<Mail className="h-3.5 w-3.5" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink">Jenis kelamin</p>
            <div className="grid grid-cols-2 gap-2">
              {GENDER_OPTIONS.map((opt) => {
                const active = selectedGender === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue('gender', opt.value, { shouldValidate: true })}
                    className={cn(
                      'rounded-2xl border px-3 py-2.5 text-center text-sm font-bold transition',
                      active
                        ? 'border-accent bg-accent text-white shadow-sm shadow-accent/25'
                        : 'border-line bg-surface text-muted hover:border-accent/40 hover:bg-accent-soft/60'
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {errors.gender?.message && (
              <p className="mt-1 text-[11px] text-coral">{errors.gender.message}</p>
            )}
          </div>

          <Input
            label="Tanggal lahir"
            type="date"
            min={birthMin}
            max={birthMax}
            error={errors.birthDate?.message}
            {...register('birthDate')}
          />

          <div>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 karakter + huruf & angka"
              leftIcon={<Lock className="h-3.5 w-3.5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted transition hover:text-ink"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password', {
                onChange: (e) => setPassword(e.target.value),
              })}
            />
            {password.length > 0 && (
              <div className="mt-1.5 flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < passwordStrength
                        ? strengthColors[passwordStrength - 1]
                        : 'bg-mist-deep'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <Input
            label="Konfirmasi"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Ulangi password"
            leftIcon={<Lock className="h-3.5 w-3.5" />}
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
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            }
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {captchaLoading && (
            <p className="text-center text-[11px] text-muted">Memuat captcha…</p>
          )}
          {captchaFetchError && (
            <p className="text-[11px] text-coral">
              Gagal memuat captcha. Refresh atau periksa API.
            </p>
          )}
          {captcha?.misconfigured && (
            <p className="text-[11px] text-amber-700">
              Captcha aktif tetapi kunci Turnstile belum diset di server.
            </p>
          )}

          {captchaRequired && captcha.siteKey && (
            <TurnstileWidget
              key={captchaReset}
              siteKey={captcha.siteKey}
              onToken={setCaptchaToken}
              className="flex justify-center overflow-visible scale-[0.92] origin-center"
            />
          )}

          <label className="flex cursor-pointer items-start gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-line text-accent focus:ring-accent"
            />
            <span>
              Setuju{' '}
              <Link to={ROUTES.TERMS} className="font-semibold text-accent hover:underline">
                Syarat
              </Link>{' '}
              &{' '}
              <Link to={ROUTES.PRIVACY} className="font-semibold text-accent hover:underline">
                Privasi
              </Link>
            </span>
          </label>

          <Button
            type="submit"
            variant="gradient"
            className="w-full"
            size="md"
            isLoading={isLoading}
            disabled={isLoading || !termsAccepted || (captchaRequired && !captchaToken)}
          >
            Daftar sekarang
          </Button>

          <p className="pt-0.5 text-center text-xs text-muted">
            Sudah punya akun?{' '}
            <Link to={ROUTES.LOGIN} className="font-semibold text-accent hover:underline">
              Masuk
            </Link>
          </p>
        </form>
      </AuthLayout>
    </PageTransition>
  );
}
