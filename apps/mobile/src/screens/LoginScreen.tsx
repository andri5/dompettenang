import { useMemo, useState } from 'react';
import {
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { login } from '../lib/auth';
import { useAuth, type RootStackParamList } from '../authContext';
import { authErrorMessage, AUTH_SAFE } from '../lib/authErrors';
import { useCaptchaConfig } from '../lib/captcha';
import { TurnstileCaptcha } from '../components/TurnstileCaptcha';
import {
  BrandMark,
  AppTextInput,
  PasswordInput,
  PrimaryButton,
  Card,
  FormLabel,
} from '../components/ui';
import { FadeInUp, ScalePress } from '../components/motion';
import { spacing, type ThemeColors } from '../theme';
import { useColors, useTheme } from '../themeContext';
import { useResponsive } from '../hooks/useResponsive';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const colors = useColors();
  const { isDark } = useTheme();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r, isDark), [colors, r, isDark]);
  const insets = useSafeAreaInsets();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const { config: captcha, required: captchaRequired, error: captchaConfigError, loading: captchaLoading } =
    useCaptchaConfig();

  const onSubmit = async () => {
    setError(null);
    if (captchaRequired && !captchaToken) {
      setError('Selesaikan verifikasi captcha dulu.');
      return;
    }
    setLoading(true);
    try {
      const result = await login(email.trim(), password, captchaToken ?? undefined);
      setUser(result.user);
    } catch (e: unknown) {
      setError(authErrorMessage(e, AUTH_SAFE.loginFailed));
      setCaptchaToken(null);
      setCaptchaReset((n) => n + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.wrap, { paddingTop: Math.max(insets.top, 12) }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.glowA} pointerEvents="none" />
      <View style={styles.glowB} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          r.pageStyle,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={r.contentStyle}>
        <FadeInUp>
          <ScalePress onPress={() => navigation.navigate('Welcome')} style={styles.back}>
            <Ionicons name="arrow-back" size={16} color={colors.brand} />
            <Text style={styles.backText}>Selamat datang</Text>
          </ScalePress>
          <BrandMark size="lg" />
          <Text style={styles.title}>Masuk</Text>
          <Text style={styles.sub}>Lanjutkan pencatatan keuanganmu</Text>
        </FadeInUp>

        <View style={styles.formCard}>
          <Card>
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.expense} />
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            <FormLabel>Email</FormLabel>
            <AppTextInput
              icon="mail-outline"
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              placeholder="nama@email.com"
              value={email}
              onChangeText={setEmail}
            />

            <FormLabel>Password</FormLabel>
            <PasswordInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              autoComplete="password"
              textContentType="password"
            />

            {captchaLoading ? (
              <Text style={{ color: colors.muted, fontSize: r.ms(12), fontWeight: '600', marginBottom: 10 }}>
                Memuat captcha…
              </Text>
            ) : null}
            {captcha?.misconfigured ? (
              <Text style={{ color: colors.amber, fontSize: r.ms(12), fontWeight: '700', marginBottom: 10 }}>
                Captcha aktif di admin, tetapi kunci Turnstile belum diset di server.
              </Text>
            ) : null}
            {captchaConfigError ? (
              <Text style={{ color: colors.expense, fontSize: r.ms(12), fontWeight: '700', marginBottom: 10 }}>
                {captchaConfigError}. Pastikan HP satu Wi‑Fi dengan PC dan API jalan.
              </Text>
            ) : null}
            {captchaRequired && captcha?.siteKey ? (
              <TurnstileCaptcha
                siteKey={captcha.siteKey}
                onToken={setCaptchaToken}
                resetKey={captchaReset}
              />
            ) : null}

            <PrimaryButton
              label="Masuk"
              icon="log-in-outline"
              onPress={onSubmit}
              loading={loading}
              disabled={loading || (captchaRequired && !captchaToken)}
            />

            <Pressable
              style={styles.forgot}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.link}>Lupa password?</Text>
            </Pressable>
          </Card>
        </View>

        <FadeInUp delay={140}>
          <View style={styles.footer}>
            <Text style={styles.footerMuted}>Belum punya akun?</Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Daftar sekarang</Text>
            </Pressable>
          </View>
        </FadeInUp>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(
  colors: ThemeColors,
  r: ReturnType<typeof useResponsive>,
  isDark: boolean
) {
  return StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  glowA: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
      backgroundColor: isDark ? 'rgba(15,155,142,0.06)' : 'rgba(15,155,142,0.12)',
  },
  glowB: {
    position: 'absolute',
    bottom: 80,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
      backgroundColor: isDark ? 'rgba(28,200,180,0.05)' : 'rgba(28,200,180,0.1)',
  },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  formCard: { marginBottom: spacing.lg },
  back: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    backgroundColor: colors.brandSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.brandSoftBorder,
  },
  backText: { color: colors.brand, fontWeight: '800', fontSize: r.ms(13) },
  title: {
    marginTop: 18,
    fontSize: r.ms(32),
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
  },
  sub: { marginTop: 6, marginBottom: 20, color: colors.muted, fontSize: r.ms(15), lineHeight: 22 },
  forgot: { marginTop: 14, alignItems: 'center' },
  link: { color: colors.brand, fontWeight: '800', fontSize: r.ms(14) },
  footer: { alignItems: 'center', gap: 6 },
  footerMuted: { color: colors.muted, fontSize: r.ms(14), fontWeight: '600' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.expenseSoft,
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  error: { flex: 1, color: colors.expense, fontWeight: '700', fontSize: r.ms(13) },
});
}
