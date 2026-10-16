import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInUp, PulseGlow } from '../components/motion';
import { radii, spacing, type ThemeColors } from '../theme';
import { useColors } from '../themeContext';
import { useResponsive } from '../hooks/useResponsive';

export function MaintenanceScreen({ onRetry }: { onRetry?: () => void }) {
  const colors = useColors();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r), [colors, r]);
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
    >
      <View style={styles.glow} />
      <FadeInUp style={styles.content}>
        <PulseGlow>
          <View style={styles.iconBox}>
            <Ionicons name="construct-outline" size={r.ms(32)} color={colors.amber} />
          </View>
        </PulseGlow>
        <Text style={styles.badge}>Maintenance</Text>
        <Text style={styles.title}>Sedang dalam perawatan</Text>
        <Text style={styles.body}>
          Dompet Tenang sementara tidak bisa diakses sementara kami menyiapkan peningkatan. Data kamu
          aman — silakan coba lagi beberapa saat lagi.
        </Text>
        {onRetry ? (
          <Pressable style={styles.btn} onPress={onRetry}>
            <Ionicons name="refresh" size={r.ms(18)} color={colors.onBrand} />
            <Text style={styles.btnText}>Coba lagi</Text>
          </Pressable>
        ) : null}
      </FadeInUp>
    </View>
  );
}

function createStyles(colors: ThemeColors, r: ReturnType<typeof useResponsive>) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      backgroundColor: '#07111f',
      paddingHorizontal: r.pagePadding,
      justifyContent: 'center',
    },
    glow: {
      position: 'absolute',
      top: 80,
      alignSelf: 'center',
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: 'rgba(217, 119, 6, 0.2)',
    },
    content: { alignItems: 'center' },
    iconBox: {
      width: 72,
      height: 72,
      borderRadius: 22,
      backgroundColor: 'rgba(254, 243, 199, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    badge: {
      color: colors.amber,
      fontWeight: '800',
      fontSize: r.ms(11),
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    title: {
      color: '#fff',
      fontSize: r.ms(26),
      fontWeight: '800',
      textAlign: 'center',
      letterSpacing: -0.4,
    },
    body: {
      marginTop: 12,
      color: 'rgba(255,255,255,0.65)',
      fontSize: r.ms(15),
      lineHeight: r.ms(22),
      textAlign: 'center',
      maxWidth: 340,
    },
    btn: {
      marginTop: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.brand,
      borderRadius: radii.lg,
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    btnText: { color: colors.onBrand, fontWeight: '800', fontSize: r.ms(15) },
  });
}
