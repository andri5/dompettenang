import { useMemo } from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInUp, PopIn, ScalePress } from '../components/motion';
import { BrandMark } from '../components/ui';
import { spacing, type ThemeColors } from '../theme';
import { useColors } from '../themeContext';
import { useResponsive } from '../hooks/useResponsive';

const SECTIONS = [
  {
    title: 'Transaksi',
    body: 'Tambah dari Beranda atau tab Transaksi. Tap item untuk edit, tahan untuk hapus. Tanggal dipilih lewat date picker.',
    icon: 'receipt-outline' as const,
    tint: '#0f9b8e',
    soft: '#d9f5f1',
    tip: 'Gunakan kalkulator di form untuk hitung cepat.',
  },
  {
    title: 'Kategori',
    body: 'Kelola dari Profil → Kategori. Setiap transaksi butuh kategori sesuai tipe (masuk/keluar).',
    icon: 'pricetags-outline' as const,
    tint: '#2563eb',
    soft: '#dbeafe',
    tip: 'Pilih warna & ikon supaya daftar lebih mudah dibaca.',
  },
  {
    title: 'Struk',
    body: 'Di form transaksi bisa unggah foto struk dari galeri atau kamera. Struk hanya bisa dilihat oleh akunmu.',
    icon: 'camera-outline' as const,
    tint: '#d97706',
    soft: '#fef3c7',
    tip: 'Simpan transaksi setelah upload agar struk tersimpan.',
  },
  {
    title: 'Privasi nominal',
    body: 'Di Beranda, tombol mata (Rp / •••) bisa menyembunyikan nominal supaya lebih aman saat layar terbuka.',
    icon: 'eye-outline' as const,
    tint: '#7c3aed',
    soft: '#ede9fe',
    tip: 'Cocok dipakai di ruang publik.',
  },
  {
    title: 'Akun & keamanan',
    body: 'Ubah nama, mata uang, dan foto di Pengaturan. Lupa password tersedia di layar masuk (link dikirim ke email).',
    icon: 'shield-checkmark-outline' as const,
    tint: '#16a34a',
    soft: '#dcfce7',
    tip: 'Mata uang tersedia: IDR dan USD.',
  },
];

export function HelpScreen() {
  const colors = useColors();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r), [colors, r]);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 16) + 32 },
      ]}
    >
      <View style={styles.glow} />

      <FadeInUp>
        <View style={styles.hero}>
          <BrandMark size="sm" />
          <Text style={styles.heroTitle}>Pusat bantuan</Text>
          <Text style={styles.heroSub}>
            Panduan singkat memakai Dompet Tenang di HP. Fitur lengkap juga tersedia di versi web.
          </Text>
          <View style={styles.heroMeta}>
            <View style={styles.metaPill}>
              <Ionicons name="flash-outline" size={13} color={colors.brandDark} />
              <Text style={styles.metaText}>Cepat</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="phone-portrait-outline" size={13} color={colors.brandDark} />
              <Text style={styles.metaText}>Mobile first</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="lock-closed-outline" size={13} color={colors.brandDark} />
              <Text style={styles.metaText}>Aman</Text>
            </View>
          </View>
        </View>
      </FadeInUp>

      {SECTIONS.map((section, index) => (
        <PopIn key={section.title} delay={60 + index * 55}>
          <ScalePress style={[styles.card, { borderColor: `${section.tint}33` }]}>
            <View style={styles.cardTop}>
              <View style={[styles.iconBox, { backgroundColor: section.soft }]}>
                <Ionicons name={section.icon} size={20} color={section.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{section.title}</Text>
                <View style={[styles.accent, { backgroundColor: section.tint }]} />
              </View>
              <Text style={[styles.step, { color: section.tint }]}>
                {String(index + 1).padStart(2, '0')}
              </Text>
            </View>
            <Text style={styles.body}>{section.body}</Text>
            <View style={[styles.tipRow, { backgroundColor: section.soft }]}>
              <Ionicons name="bulb-outline" size={14} color={section.tint} />
              <Text style={[styles.tipText, { color: section.tint }]}>{section.tip}</Text>
            </View>
          </ScalePress>
        </PopIn>
      ))}

      <FadeInUp delay={340}>
        <View style={styles.footerCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={styles.footerTitle}>Butuh lebih lengkap?</Text>
            <Text style={styles.footerBody}>
              Buka Dompet Tenang web untuk export laporan, insight lanjutan, dan fitur desktop.
            </Text>
          </View>
        </View>
      </FadeInUp>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors, r: ReturnType<typeof useResponsive>) {
  return StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: r.pagePadding, paddingTop: 12 },
  glow: {
    position: 'absolute',
    top: -20,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(15,155,142,0.12)',
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 14,
    overflow: 'hidden',
  },
  heroTitle: {
    marginTop: 10,
    fontSize: r.ms(26),
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  heroSub: {
    marginTop: 6,
    color: colors.muted,
    lineHeight: 21,
    fontSize: r.ms(14),
    fontWeight: '600',
  },
  heroMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brandSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.brandSoftBorder,
  },
  metaText: { color: colors.brandDark, fontWeight: '800', fontSize: r.ms(11) },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: '800', color: colors.text, fontSize: r.ms(16) },
  accent: { marginTop: 6, width: 28, height: 3, borderRadius: 999 },
  step: { fontWeight: '900', fontSize: r.ms(16), letterSpacing: 0.5 },
  body: { color: colors.muted, lineHeight: 20, fontSize: r.ms(13), fontWeight: '600' },
  tipRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tipText: { flex: 1, fontWeight: '800', fontSize: r.ms(12), lineHeight: 16 },
  footerCard: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: colors.brandSoft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.brandSoftBorder,
    padding: 14,
  },
  footerTitle: { fontWeight: '800', color: colors.brandDark, fontSize: r.ms(14) },
  footerBody: {
    marginTop: 4,
    color: colors.muted,
    fontSize: r.ms(12),
    lineHeight: 18,
    fontWeight: '600',
  },
});
}
