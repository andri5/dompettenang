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
import { resetPassword } from '../lib/auth';
import type { RootStackParamList } from '../authContext';
import { authErrorMessage, AUTH_SAFE } from '../lib/authErrors';
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
import { useColors } from '../themeContext';
import { useResponsive } from '../hooks/useResponsive';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const colors = useColors();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r), [colors, r]);
  const insets = useSafeAreaInsets();
  const token = useMemo(() => (route.params?.token || '').trim(), [route.params?.token]);
  const [tokenInput, setTokenInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const effectiveToken = token || tokenInput.trim();

  const isStrongPassword = (pwd: string) => {
    return pwd.length >= 8 && /[A-Za-z]/.test(pwd) && /\d/.test(pwd);
  };

  const onSubmit = async () => {
    setError(null);
    setSuccess(null);
    if (!effectiveToken) {
      setError(AUTH_SAFE.resetInvalid);
      return;
    }
    if (!isStrongPassword(password)) {
      setError('Password minimal 8 karakter dan mengandung huruf serta angka.');
      return;
    }
    if (password !== confirm) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    setLoading(true);
    try {
      const message = await resetPassword(effectiveToken, password);
      setSuccess(message);
      setTimeout(() => navigation.navigate('Login'), 1200);
    } catch (e: unknown) {
      setError(authErrorMessage(e, AUTH_SAFE.resetInvalid));
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
          <ScalePress onPress={() => navigation.navigate('ForgotPassword')} style={styles.back}>
            <Ionicons name="arrow-back" size={16} color={colors.brand} />
            <Text style={styles.backText}>Kembali</Text>
          </ScalePress>
          <BrandMark size="lg" />
          <Text style={styles.title}>Password baru</Text>
          <Text style={styles.sub}>Masukkan password baru untuk akunmu.</Text>
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

          {!token ? (
            <>
              <FormLabel>Token reset</FormLabel>
              <AppTextInput
                icon="key-outline"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Tempel token reset"
                value={tokenInput}
                onChangeText={setTokenInput}
              />
            </>
          ) : null}

          <FormLabel>Password baru</FormLabel>
          <PasswordInput
            placeholder="Min. 8 karakter + huruf & angka"
            value={password}
            onChangeText={setPassword}
            autoComplete="new-password"
            textContentType="newPassword"
          />

          <FormLabel>Konfirmasi</FormLabel>
          <PasswordInput
            placeholder="Ulangi password baru"
            value={confirm}
            onChangeText={setConfirm}
            autoComplete="new-password"
            textContentType="newPassword"
          />

          <PrimaryButton
            label="Simpan password"
            icon="shield-checkmark-outline"
            onPress={onSubmit}
            loading={loading}
            disabled={loading || !effectiveToken}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors, r: ReturnType<typeof useResponsive>) {
  return StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  glow: {
    position: 'absolute',
    top: 60,
    left: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(15,155,142,0.12)',
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
});
}
