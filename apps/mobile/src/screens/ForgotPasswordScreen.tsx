import { useMemo, useState } from 'react';
import {
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  View,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { forgotPassword } from '../lib/auth';
import type { RootStackParamList } from '../authContext';
import { authErrorMessage, AUTH_SAFE } from '../lib/authErrors';
import { useCaptchaConfig } from '../lib/captcha';
import { TurnstileCaptcha } from '../components/TurnstileCaptcha';
import {
  BrandMark,
  AppTextInput,
  PrimaryButton,
  Card,
  FormLabel,
} from '../components/ui';
import { FadeInUp, ScalePress } from '../components/motion';
import { spacing, type ThemeColors } from '../theme';
import { useColors } from '../themeContext';
import { useResponsive } from '../hooks/useResponsive';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

function extractTokenFromResetUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const fromQuery = parsed.searchParams.get('token');
    if (fromQuery) return fromQuery;
    const hash = parsed.hash.replace(/^#/, '');
    if (hash.includes('token=')) {
      const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : hash);
      return params.get('token');
    }
  } catch {
    const match = url.match(/[?&#]token=([^&]+)/);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }
  return null;
}

export function ForgotPasswordScreen({ navigation }: Props) {
  const colors = useColors();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r), [colors, r]);
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const { config: captcha, required: captchaRequired, error: captchaConfigError, loading: captchaLoading } =
    useCaptchaConfig();

  const onSubmit = async () => {
    setError(null);
    setSuccess(null);
    if (!email.trim()) {
      setError('Masukkan email.');
      return;
    }
    if (captchaRequired && !captchaToken) {
      setError('Selesaikan verifikasi captcha dulu.');
      return;
    }
    setLoading(true);
    try {
      const result = await forgotPassword(email.trim(), captchaToken ?? undefined);
      setSuccess(result.message || AUTH_SAFE.forgotPassword);
      const token = extractTokenFromResetUrl(result.resetUrl);
      if (token) {
        navigation.navigate('ResetPassword', { token });
      }
    } catch (e: unknown) {
      setError(authErrorMessage(e, AUTH_SAFE.network));
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
      <View style={styles.glow} pointerEvents="none" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <FadeInUp>
          <ScalePress onPress={() => navigation.navigate('Login')} style={styles.back}>
            <Ionicons name="arrow-back" size={r.ms(16)} color={colors.brand} />
            <Text style={styles.backText}>Kembali ke masuk</Text>
          </ScalePress>
          <BrandMark size="lg" />
          <Text style={styles.title}>Lupa password</Text>
          <Text style={styles.sub}>
            Kami kirim link reset ke email. Buka tautan di HP atau tempel token di layar reset.
          </Text>
        </FadeInUp>

        <Card>
          {error ? (
            <View style={styles.bannerError}>
              <Ionicons name="alert-circle" size={16} color={colors.expense} />
              <Text style={styles.bannerErrorText}>{error}</Text>
            </View>
          ) : null}
          {success ? (
            <View style={styles.bannerOk}>
              <Ionicons name="checkmark-circle" size={16} color={colors.income} />
              <Text style={styles.bannerOkText}>{success}</Text>
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
            label="Kirim link reset"
            icon="send-outline"
            onPress={onSubmit}
            loading={loading}
            disabled={loading || (captchaRequired && !captchaToken)}
          />
        </Card>

        <FadeInUp delay={120}>
          <Pressable
            onPress={() => navigation.navigate('ResetPassword', {})}
            style={styles.linkWrap}
          >
            <Text style={styles.link}>Sudah punya token? Reset di sini</Text>
          </Pressable>
        </FadeInUp>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors, r: ReturnType<typeof useResponsive>) {
  return StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  glow: {
    position: 'absolute',
    top: 40,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(217,119,6,0.12)',
  },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: r.pagePadding },
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
    fontSize: r.ms(30),
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  sub: { marginTop: 6, marginBottom: 18, color: colors.muted, lineHeight: r.ms(21), fontSize: r.ms(14) },
  bannerError: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: colors.expenseSoft,
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  bannerErrorText: { flex: 1, color: colors.expense, fontWeight: '700', fontSize: r.ms(13) },
  bannerOk: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: colors.incomeSoft,
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  bannerOkText: { flex: 1, color: colors.income, fontWeight: '700', fontSize: r.ms(13) },
  linkWrap: { alignItems: 'center', marginTop: 4 },
  link: { color: colors.brand, fontWeight: '800' },
});
}
