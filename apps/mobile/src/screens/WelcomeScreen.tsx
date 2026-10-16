import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { RootStackParamList } from '../authContext';
import { FadeInUp, ScalePress, PulseGlow } from '../components/motion';
import { radii, spacing, type ThemeColors } from '../theme';
import { useColors } from '../themeContext';
import { useResponsive } from '../hooks/useResponsive';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const colors = useColors();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r), [colors, r]);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 16) }]}>
      <StatusBar style="light" />

      <View style={styles.glowA} />
      <View style={styles.glowB} />
      <View style={styles.grid} pointerEvents="none" />

      <View
        style={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 20 },
        ]}
      >
        <FadeInUp>
          <View style={styles.brandPill}>
            <PulseGlow>
              <View style={styles.logoBox}>
                <Ionicons name="wallet" size={22} color={colors.text} />
              </View>
            </PulseGlow>
            <View>
              <Text style={styles.brandName}>Dompet Tenang</Text>
              <Text style={styles.brandTag}>Finance OS</Text>
            </View>
          </View>
        </FadeInUp>

        <FadeInUp delay={80} style={{ marginTop: 28 }}>
          <Text style={styles.hero}>Kendalikan</Text>
          <Text style={styles.heroAccent}>arus kas harianmu</Text>
          <Text style={styles.desc}>
            Catat pemasukan dan pengeluaran dalam satu ruang yang cepat dan jelas.
          </Text>
        </FadeInUp>

        <FadeInUp delay={140} style={styles.points}>
          {[
            'Ringkas & responsif',
            'Siap dipakai setiap hari',
            'Kategori, struk, dan insight',
          ].map((line) => (
            <View key={line} style={styles.pointRow}>
              <Ionicons name="sparkles" size={14} color={colors.brandBright} />
              <Text style={styles.pointText}>{line}</Text>
            </View>
          ))}
        </FadeInUp>

        <View style={{ flex: 1 }} />

        <FadeInUp delay={200}>
          <ScalePress onPress={() => navigation.navigate('Login')}>
            <View style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Mulai sekarang</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.onBrand} />
            </View>
          </ScalePress>

          <Pressable
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.secondaryBtnText}>Buat akun baru</Text>
          </Pressable>

          <Text style={styles.footer}>
            Dompet Tenang © {new Date().getFullYear()} — catat dengan tenang
          </Text>
        </FadeInUp>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors, r: ReturnType<typeof useResponsive>) {
  return StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#07111f',
    overflow: 'hidden',
  },
  glowA: {
    position: 'absolute',
    top: -40,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(28, 200, 180, 0.28)',
  },
  glowB: {
    position: 'absolute',
    bottom: 40,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(15, 155, 142, 0.22)',
  },
  grid: {
    ...StyleSheet.absoluteFill,
    opacity: 0.08,
    borderWidth: 1,
    borderColor: 'transparent',
    // soft grid feel via repeating thin lines approximated with borders on overlay
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: r.pagePadding,
    paddingTop: r.ms(24),
  },
  brandPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radii.xl,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.brandBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: '#fff',
    fontSize: r.ms(20),
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  brandTag: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: r.ms(10),
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  hero: {
    color: '#fff',
    fontSize: r.ms(36),
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: r.ms(42),
  },
  heroAccent: {
    color: colors.brandBright,
    fontSize: r.ms(34),
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: r.ms(40),
    marginBottom: r.ms(14),
  },
  desc: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: r.ms(16),
    lineHeight: r.ms(24),
    maxWidth: 340,
  },
  points: { marginTop: 28, gap: 12 },
  pointRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pointText: { color: 'rgba(255,255,255,0.6)', fontSize: r.ms(14), fontWeight: '600' },
  primaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: radii.lg,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: { color: colors.onBrand, fontWeight: '800', fontSize: r.ms(16) },
  secondaryBtn: {
    marginTop: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  secondaryBtnText: { color: '#fff', fontWeight: '700', fontSize: r.ms(15) },
  footer: {
    marginTop: 18,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    fontSize: r.ms(12),
  },
});
}
