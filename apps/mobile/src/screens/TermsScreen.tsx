import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../authContext';
import { apiClient } from '../lib/api';
import { BrandMark } from '../components/ui';
import { FadeInUp, ScalePress } from '../components/motion';
import { type ThemeColors } from '../theme';
import { useColors } from '../themeContext';
import { useResponsive } from '../hooks/useResponsive';

type Props = NativeStackScreenProps<RootStackParamList, 'Terms'>;

const FALLBACK = [
  'Dengan mendaftar dan menggunakan Dompet Tenang, Anda menyetujui untuk memakai aplikasi sebagai catatan keuangan pribadi secara wajar dan sesuai hukum yang berlaku.',
  'Anda bertanggung jawab menjaga kerahasiaan akun (email dan password). Dompet Tenang tidak bertanggung jawab atas kerugian akibat kelalaian menjaga kredensial atau penggunaan perangkat yang tidak aman.',
  'Data transaksi yang Anda masukkan milik Anda. Kami menyediakan layanan penyimpanan dan tampilan untuk membantu pengelolaan keuangan pribadi, tanpa jaminan hasil investasi atau saran keuangan profesional.',
  'Kami dapat memperbarui ketentuan ini dari waktu ke waktu. Penggunaan berkelanjutan setelah pembaruan dianggap sebagai persetujuan terhadap ketentuan terbaru.',
];

const TINTS = [
  { tint: '#0f9b8e', soft: '#d9f5f1', icon: 'document-text-outline' as const },
  { tint: '#d97706', soft: '#fef3c7', icon: 'key-outline' as const },
  { tint: '#2563eb', soft: '#dbeafe', icon: 'folder-outline' as const },
  { tint: '#7c3aed', soft: '#ede9fe', icon: 'refresh-outline' as const },
];

function splitParas(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function TermsScreen({ navigation }: Props) {
  const colors = useColors();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r), [colors, r]);
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('Syarat & Ketentuan');
  const [paras, setParas] = useState(FALLBACK);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get('/legal/terms');
        const doc = res.data?.data as { title?: string; body?: string; updatedAt?: string } | undefined;
        if (!cancelled && doc?.body) {
          setTitle(doc.title || 'Syarat & Ketentuan');
          setParas(splitParas(doc.body));
          setUpdatedAt(doc.updatedAt || null);
        }
      } catch {
        /* keep fallback */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Agustus 2026';

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 12) + 12,
        paddingBottom: Math.max(insets.bottom, 16) + 28,
        paddingHorizontal: r.pagePadding,
      }}
    >
      <View style={styles.glow} pointerEvents="none" />

      <FadeInUp>
        <ScalePress onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={r.ms(16)} color={colors.brand} />
          <Text style={styles.backText}>Kembali</Text>
        </ScalePress>

        <View style={styles.hero}>
          <BrandMark size="sm" />
          <Text style={styles.badge}>Legal</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.lead}>
            Ringkasan aturan memakai Dompet Tenang agar pencatatan keuangan tetap aman dan jelas.
          </Text>
        </View>
      </FadeInUp>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginVertical: 20 }} />
      ) : (
        paras.map((body, index) => {
          const tone = TINTS[index % TINTS.length];
          return (
            <FadeInUp key={`${index}-${body.slice(0, 24)}`} delay={50 + index * 45}>
              <View style={[styles.card, { borderColor: `${tone.tint}33` }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.iconBox, { backgroundColor: tone.soft }]}>
                    <Ionicons name={tone.icon} size={r.ms(18)} color={tone.tint} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Bagagraf {index + 1}</Text>
                    <View style={[styles.accent, { backgroundColor: tone.tint }]} />
                  </View>
                  <Text style={[styles.step, { color: tone.tint }]}>
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                </View>
                <Text style={styles.body}>{body}</Text>
              </View>
            </FadeInUp>
          );
        })
      )}

      <FadeInUp delay={240}>
        <View style={styles.footer}>
          <Ionicons name="time-outline" size={r.ms(14)} color={colors.muted} />
          <Text style={styles.meta}>Terakhir diperbarui: {updatedLabel}</Text>
        </View>
      </FadeInUp>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors, r: ReturnType<typeof useResponsive>) {
  return StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg },
    glow: {
      position: 'absolute',
      top: 20,
      right: -50,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: 'rgba(15,155,142,0.12)',
    },
    back: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 14,
      backgroundColor: colors.brandSoft,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.brandSoftBorder,
    },
    backText: { color: colors.brand, fontWeight: '800', fontSize: r.ms(13) },
    hero: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      marginBottom: 14,
    },
    badge: {
      marginTop: 12,
      alignSelf: 'flex-start',
      color: colors.brand,
      fontWeight: '800',
      fontSize: r.ms(11),
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    title: {
      marginTop: 6,
      fontSize: r.ms(28),
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
    },
    lead: {
      marginTop: 8,
      color: colors.muted,
      lineHeight: r.ms(21),
      fontSize: r.ms(14),
      fontWeight: '600',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1.5,
      padding: 14,
      marginBottom: 10,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: { fontWeight: '800', color: colors.text, fontSize: r.ms(15) },
    accent: { marginTop: 6, width: 24, height: 3, borderRadius: 999 },
    step: { fontWeight: '900', fontSize: r.ms(15) },
    body: { color: colors.muted, lineHeight: r.ms(21), fontSize: r.ms(13), fontWeight: '600' },
    footer: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      justifyContent: 'center',
    },
    meta: { fontSize: r.ms(12), color: colors.muted, fontWeight: '600' },
  });
}
