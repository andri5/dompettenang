import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  createCategory,
  getCategories,
  updateCategory,
  type TxType,
} from '../lib/finance';
import { CategoryIcon } from '../components/CategoryIcon';
import { FadeInUp, ScalePress, PopIn } from '../components/motion';
import { PageLoader } from '../components/PageStatus';
import { useDialog } from '../components/AppDialog';
import { spacing, type ThemeColors } from '../theme';
import { useColors } from '../themeContext';
import { useResponsive } from '../hooks/useResponsive';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'CategoryForm'>;

export function CategoryFormScreen({ navigation, route }: Props) {
  const colors = useColors();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r), [colors, r]);
  const editId = route.params?.id;
  const isEdit = Boolean(editId);
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();

  const [name, setName] = useState('');
  const [type, setType] = useState<TxType>('EXPENSE');
  const [color, setColor] = useState<string>(CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState<string>(CATEGORY_ICONS[0]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit kategori' : 'Tambah kategori' });
  }, [isEdit, navigation]);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await getCategories();
        const found = list.find((c) => c.id === editId);
        if (!found) throw new Error('not found');
        if (cancelled) return;
        setName(found.name);
        setType(found.type);
        setColor(found.color || CATEGORY_COLORS[0]);
        setIcon(found.icon || CATEGORY_ICONS[0]);
      } catch {
        if (!cancelled) {
          showDialog({
            variant: 'error',
            title: 'Kategori tidak ditemukan',
            message: 'Data mungkin sudah dihapus.',
            onConfirm: () => navigation.goBack(),
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, navigation, showDialog]);

  const onSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Nama kategori wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        color,
        icon,
      };
      if (isEdit && editId) {
        await updateCategory(editId, payload);
        showDialog({
          variant: 'success',
          title: 'Kategori diperbarui',
          message: 'Perubahan sudah disimpan.',
          confirmLabel: 'Saya mengerti',
          onConfirm: () => navigation.goBack(),
        });
      } else {
        await createCategory(payload);
        showDialog({
          variant: 'success',
          title: 'Kategori ditambahkan',
          message: 'Kategori baru siap dipakai.',
          confirmLabel: 'Saya mengerti',
          onConfirm: () => navigation.goBack(),
        });
      }
    } catch (e: unknown) {
      const message =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal menyimpan kategori.';
      setError(message);
      showDialog({ variant: 'error', title: 'Gagal menyimpan', message });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!name.trim()) {
      navigation.goBack();
      return;
    }
    showDialog({
      variant: 'confirm',
      title: 'Batalkan?',
      message: 'Perubahan belum disimpan.',
      showCancel: true,
      cancelLabel: 'Tetap',
      confirmLabel: 'Keluar',
      onConfirm: () => navigation.goBack(),
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <PageLoader label="Memuat kategori…" />
      </View>
    );
  }

  const isIncome = type === 'INCOME';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.wrap}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PopIn>
          <View style={[styles.previewCard, { borderColor: color }]}>
            <View style={[styles.previewGlow, { backgroundColor: `${color}22` }]} />
            <CategoryIcon icon={icon} color={color} size={r.ms(28)} box={r.ms(64)} />
            <Text style={styles.previewName} numberOfLines={1}>
              {name.trim() || 'Nama kategori'}
            </Text>
            <View
              style={[
                styles.previewBadge,
                {
                  backgroundColor: isIncome ? colors.incomeSoft : colors.expenseSoft,
                },
              ]}
            >
              <Ionicons
                name={isIncome ? 'arrow-down' : 'arrow-up'}
                size={r.ms(12)}
                color={isIncome ? colors.income : colors.expense}
              />
              <Text
                style={{
                  color: isIncome ? colors.income : colors.expense,
                  fontWeight: '800',
                  fontSize: r.ms(12),
                }}
              >
                {isIncome ? 'Pemasukan' : 'Pengeluaran'}
              </Text>
            </View>
          </View>
        </PopIn>

        <FadeInUp delay={60}>
          <Text style={styles.label}>Nama</Text>
          <TextInput
            style={styles.input}
            placeholder="Misal: Makanan"
            placeholderTextColor={colors.faint}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Tipe</Text>
          <View style={styles.typeRow}>
            {(
              [
                ['EXPENSE', 'Pengeluaran', 'arrow-up-circle', colors.expense, colors.expenseSoft],
                ['INCOME', 'Pemasukan', 'arrow-down-circle', colors.income, colors.incomeSoft],
              ] as const
            ).map(([t, label, ion, tint, soft]) => {
              const active = type === t;
              return (
                <ScalePress
                  key={t}
                  onPress={() => setType(t)}
                  style={[
                    styles.typeChip,
                    active && { backgroundColor: soft, borderColor: tint },
                  ]}
                >
                  <Ionicons
                    name={ion}
                    size={r.ms(18)}
                    color={active ? tint : colors.muted}
                  />
                  <Text style={[styles.typeText, active && { color: tint }]}>{label}</Text>
                </ScalePress>
              );
            })}
          </View>
        </FadeInUp>

        <FadeInUp delay={100}>
          <Text style={styles.label}>Warna</Text>
          <View style={styles.swatchWrap}>
            {CATEGORY_COLORS.map((c) => {
              const active = color === c;
              return (
                <ScalePress
                  key={c}
                  onPress={() => setColor(c)}
                  style={[
                    styles.swatch,
                    { backgroundColor: c },
                    active && styles.swatchActive,
                  ]}
                >
                  {active ? (
                    <Ionicons name="checkmark" size={r.ms(14)} color="#fff" />
                  ) : null}
                </ScalePress>
              );
            })}
          </View>

          <Text style={styles.label}>Ikon</Text>
          <View style={styles.iconWrap}>
            {CATEGORY_ICONS.map((ic) => {
              const active = icon === ic;
              return (
                <ScalePress
                  key={ic}
                  onPress={() => setIcon(ic)}
                  style={[
                    styles.iconChip,
                    active && { borderColor: color, backgroundColor: `${color}18` },
                  ]}
                >
                  <CategoryIcon
                    icon={ic}
                    color={color || colors.brand}
                    size={r.ms(18)}
                    box={r.ms(36)}
                  />
                </ScalePress>
              );
            })}
          </View>
        </FadeInUp>

        <FadeInUp delay={140}>
          <ScalePress style={styles.saveBtn} onPress={onSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={r.ms(18)} color="#fff" />
                <Text style={styles.saveText}>
                  {isEdit ? 'Simpan perubahan' : 'Simpan kategori'}
                </Text>
              </>
            )}
          </ScalePress>
          <Pressable onPress={handleCancel} style={{ marginTop: 14 }}>
            <Text style={styles.cancel}>Batal</Text>
          </Pressable>
        </FadeInUp>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors, r: ReturnType<typeof useResponsive>) {
  return StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: r.pagePadding, paddingTop: r.ms(12) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  previewCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 2,
    paddingVertical: 22,
    paddingHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  previewGlow: {
    position: 'absolute',
    top: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  previewName: {
    marginTop: 12,
    fontSize: r.ms(20),
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  previewBadge: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  label: {
    fontWeight: '800',
    color: colors.muted,
    marginBottom: 8,
    marginTop: 10,
    fontSize: r.ms(11),
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: r.ms(15),
    fontWeight: '600',
  },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  typeText: { fontWeight: '800', color: colors.muted, fontSize: r.ms(13) },
  swatchWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchActive: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#07111f',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  iconWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconChip: {
    padding: 4,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  saveBtn: {
    marginTop: r.ms(22),
    backgroundColor: colors.brand,
    borderRadius: 16,
    paddingVertical: r.ms(14),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveText: { color: '#fff', fontWeight: '800', fontSize: r.ms(15) },
  cancel: { textAlign: 'center', color: colors.muted, fontWeight: '700' },
  error: {
    backgroundColor: colors.dangerBg,
    color: colors.dangerText,
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
});
}
