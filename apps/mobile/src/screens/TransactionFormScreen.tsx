import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createTransaction,
  getCategories,
  getTransaction,
  updateTransaction,
  type Category,
  type TxType,
} from '../lib/finance';
import { authImageSource, uploadReceipt } from '../lib/upload';
import { formatDateShort, todayISO } from '../lib/format';
import { formatAmountInput, parseAmountInput } from '../lib/amountInput';
import { enqueueOfflineAction, isDeviceOnline } from '../lib/offlineQueue';
import { Ionicons } from '@expo/vector-icons';
import { AmountCalculator } from '../components/AmountCalculator';
import { CategoryIcon } from '../components/CategoryIcon';
import { FadeInUp, ScalePress } from '../components/motion';
import { AppTextInput, FormLabel } from '../components/ui';
import { PageLoader } from '../components/PageStatus';
import { useDialog } from '../components/AppDialog';
import { type ThemeColors } from '../theme';
import { useColors } from '../themeContext';
import { useResponsive } from '../hooks/useResponsive';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'TransactionForm'>;

function parseAmount(raw: string): number {
  return parseAmountInput(raw);
}

function isoToDate(iso: string): Date {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function dateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function TransactionFormScreen({ navigation, route }: Props) {
  const colors = useColors();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r), [colors, r]);
  const editId = route.params?.id;
  const isEdit = Boolean(editId);
  const captureReceipt = Boolean(route.params?.captureReceipt);
  const initialReceiptUrl = route.params?.receiptUrl;
  const initialType = route.params?.type;
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();

  const [type, setType] = useState<TxType>(initialType === 'INCOME' ? 'INCOME' : 'EXPENSE');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [loadingCats, setLoadingCats] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefilling, setPrefilling] = useState(isEdit);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(initialReceiptUrl || null);
  const [receiptPreview, setReceiptPreview] = useState<{
    uri: string;
    headers?: { Authorization: string };
  } | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  useEffect(() => {
    if (isEdit || !initialType) return;
    setType(initialType);
  }, [initialType, isEdit]);

  useEffect(() => {
    navigation.setOptions({
      title: isEdit
        ? 'Edit transaksi'
        : captureReceipt
          ? 'Catat dari struk'
          : initialType === 'INCOME'
            ? 'Tambah pemasukan'
            : initialType === 'EXPENSE'
              ? 'Tambah pengeluaran'
              : 'Tambah transaksi',
    });
  }, [isEdit, captureReceipt, initialType, navigation]);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const tx = await getTransaction(editId);
        if (cancelled) return;
        setType(tx.type);
        setAmount(formatAmountInput(String(Math.round(tx.amount))));
        setNote(tx.description || '');
        setDate(tx.date.slice(0, 10));
        setCategoryId(tx.categoryId);
        setReceiptUrl(tx.receiptUrl || null);
        setPrefilling(true);
      } catch {
        if (!cancelled) {
          setError('Gagal memuat transaksi.');
          showDialog({
            variant: 'error',
            title: 'Transaksi tidak ditemukan',
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

  const loadCategories = useCallback(async () => {
    setLoadingCats(true);
    try {
      const list = await getCategories(type);
      setCategories(list);
      setCategoryId((prev) => {
        if (prev && list.some((c) => c.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch {
      setError('Gagal memuat kategori.');
    } finally {
      setLoadingCats(false);
      setPrefilling(false);
    }
  }, [type]);

  useEffect(() => {
    if (loading && isEdit) return;
    void loadCategories();
  }, [type, loading, isEdit, loadCategories]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const src = await authImageSource(receiptUrl);
      if (!cancelled) setReceiptPreview(src);
    })();
    return () => {
      cancelled = true;
    };
  }, [receiptUrl]);

  const pickReceipt = useCallback(
    async (fromCamera: boolean, opts?: { quiet?: boolean }) => {
      if (fromCamera) {
        const cam = await ImagePicker.requestCameraPermissionsAsync();
        if (!cam.granted) {
          showDialog({
            variant: 'warning',
            title: 'Izin kamera',
            message: 'Izinkan kamera untuk foto struk.',
          });
          return;
        }
      } else {
        const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!lib.granted) {
          showDialog({
            variant: 'warning',
            title: 'Izin galeri',
            message: 'Izinkan galeri untuk unggah struk.',
          });
          return;
        }
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
          });

      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setUploadingReceipt(true);
      try {
        const uploaded = await uploadReceipt(
          asset.uri,
          asset.mimeType || 'image/jpeg',
          asset.fileName || undefined
        );
        setReceiptUrl(uploaded.url);
        if (!opts?.quiet) {
          showDialog({
            variant: 'success',
            title: 'Struk diunggah',
            message: 'Simpan transaksi agar struk tersimpan.',
          });
        }
      } catch (e: unknown) {
        const message =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal mengunggah struk.';
        showDialog({ variant: 'error', title: 'Upload gagal', message });
      } finally {
        setUploadingReceipt(false);
      }
    },
    [showDialog]
  );

  useEffect(() => {
    if (isEdit || !captureReceipt) return;
    const timer = setTimeout(() => {
      void pickReceipt(true, { quiet: true });
      navigation.setParams({ captureReceipt: false });
    }, 350);
    return () => clearTimeout(timer);
  }, [captureReceipt, isEdit, navigation, pickReceipt]);

  const onSave = async () => {
    setError(null);
    const parsed = parseAmount(amount);
    if (!parsed || parsed <= 0) {
      setError('Masukkan jumlah yang valid.');
      return;
    }
    if (!categoryId) {
      setError('Pilih kategori. Buat dulu di Profil → Kelola kategori.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        amount: parsed,
        categoryId,
        type,
        date,
        description: note.trim() || undefined,
        receiptUrl,
      };

      const online = await isDeviceOnline();
      if (!online) {
        if (isEdit && editId) {
          await enqueueOfflineAction({
            type: 'UPDATE_TRANSACTION',
            payload: { transactionId: editId, ...payload },
          });
        } else {
          await enqueueOfflineAction({
            type: 'CREATE_TRANSACTION',
            payload,
          });
        }
        showDialog({
          variant: 'success',
          title: 'Disimpan offline',
          message:
            'Tidak ada internet. Transaksi masuk antrian dan akan dikirim otomatis saat koneksi kembali.',
          confirmLabel: 'Saya mengerti',
          onConfirm: () => navigation.goBack(),
        });
        return;
      }

      if (isEdit && editId) {
        await updateTransaction(editId, payload);
        showDialog({
          variant: 'success',
          title: 'Transaksi diperbarui',
          message: 'Perubahan sudah disimpan.',
          confirmLabel: 'Saya mengerti',
          onConfirm: () => navigation.goBack(),
        });
      } else {
        await createTransaction(payload);
        showDialog({
          variant: 'success',
          title: 'Transaksi ditambahkan',
          message: 'Catatan baru sudah masuk ke riwayatmu.',
          confirmLabel: 'Saya mengerti',
          onConfirm: () => navigation.goBack(),
        });
      }
    } catch (e: unknown) {
      const message =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal menyimpan transaksi.';
      setError(message);
      showDialog({ variant: 'error', title: 'Gagal menyimpan', message });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const hasDraft = Boolean(amount.trim() || note.trim() || receiptUrl);
    if (!hasDraft) {
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
        <PageLoader label="Memuat transaksi…" />
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
          r.pageStyle,
          { paddingBottom: Math.max(insets.bottom, 16) + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={r.contentStyle}>
        <View style={styles.typeRow}>
          {(
            [
              {
                key: 'EXPENSE' as const,
                label: 'Pengeluaran',
                hint: 'Uang keluar',
                symbol: '−',
                ion: 'arrow-up-circle' as const,
                tint: colors.expense,
                soft: colors.expenseSoft,
                border: colors.expenseBorder,
              },
              {
                key: 'INCOME' as const,
                label: 'Pemasukan',
                hint: 'Uang masuk',
                symbol: '+',
                ion: 'arrow-down-circle' as const,
                tint: colors.income,
                soft: colors.incomeSoft,
                border: colors.incomeBorder,
              },
            ] as const
          ).map((item) => {
            const active = type === item.key;
            return (
              <ScalePress
                key={item.key}
                onPress={() => {
                  if (!prefilling) setCategoryId(null);
                  setType(item.key);
                }}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: active ? item.soft : colors.surface,
                    borderColor: active ? item.tint : colors.border,
                  },
                ]}
              >
                {active ? (
                  <View style={[styles.typeCheck, { backgroundColor: item.tint }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                ) : null}

                <View
                  style={[
                    styles.typeGlyph,
                    {
                      backgroundColor: active ? '#fff' : item.soft,
                      borderColor: active ? item.border : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.typeSymbol, { color: item.tint }]}>{item.symbol}</Text>
                </View>

                <Ionicons
                  name={item.ion}
                  size={16}
                  color={active ? item.tint : colors.faint}
                  style={{ marginTop: 8 }}
                />
                <Text style={[styles.typeLabel, active && { color: item.tint }]}>
                  {item.label}
                </Text>
                <Text style={styles.typeHint}>{item.hint}</Text>
                <Text style={[styles.typePick, active && { color: item.tint }]}>
                  {active ? 'Dipilih' : 'Pilih'}
                </Text>
              </ScalePress>
            );
          })}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.expense} />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        <FadeInUp delay={50}>
          <FormLabel>Jumlah</FormLabel>
          <View style={styles.amountRow}>
            <View style={{ flex: 1 }}>
              <AppTextInput
                icon="cash-outline"
                keyboardType="numeric"
                placeholder="50.000"
                value={amount}
                onChangeText={(v) => setAmount(formatAmountInput(v))}
                style={{ marginBottom: 0 }}
              />
            </View>
            <ScalePress style={styles.calcBtn} onPress={() => setCalcOpen(true)}>
              <Ionicons name="calculator-outline" size={22} color={colors.onBrand} />
            </ScalePress>
          </View>
        </FadeInUp>
        <AmountCalculator
          visible={calcOpen}
          onClose={() => setCalcOpen(false)}
          initialValue={parseAmount(amount) || undefined}
          onApply={(value) => setAmount(formatAmountInput(String(Math.round(value))))}
        />

        <FadeInUp delay={80}>
          <FormLabel>Tanggal</FormLabel>
          <Pressable style={styles.dateBtn} onPress={() => setShowPicker(true)}>
            <View style={styles.dateLeft}>
              <Ionicons name="calendar-outline" size={18} color={colors.brand} />
              <Text style={styles.dateBtnText}>{formatDateShort(date)}</Text>
            </View>
            <Text style={styles.dateBtnHint}>Ubah</Text>
          </Pressable>
          {showPicker ? (
            <DateTimePicker
              value={isoToDate(date)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, selected) => {
                if (Platform.OS === 'android') setShowPicker(false);
                if (selected) setDate(dateToISO(selected));
              }}
            />
          ) : null}
          {Platform.OS === 'ios' && showPicker ? (
            <Pressable onPress={() => setShowPicker(false)} style={{ marginBottom: 8 }}>
              <Text style={styles.donePicker}>Selesai pilih tanggal</Text>
            </Pressable>
          ) : null}

          <FormLabel>Catatan (opsional)</FormLabel>
          <AppTextInput
            icon="create-outline"
            placeholder="Misal: makan siang"
            value={note}
            onChangeText={setNote}
          />
        </FadeInUp>

        <FadeInUp delay={110}>
          <FormLabel>Kategori</FormLabel>
          {loadingCats ? (
            <ActivityIndicator color={colors.brand} />
          ) : categories.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.hint}>Belum ada kategori untuk tipe ini.</Text>
              <Pressable onPress={() => navigation.navigate('Categories')}>
                <Text style={styles.link}>Kelola kategori →</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.catWrap}>
              {categories.map((c) => {
                const active = categoryId === c.id;
                const tint = c.color || colors.brand;
                return (
                  <ScalePress
                    key={c.id}
                    onPress={() => setCategoryId(c.id)}
                    style={[
                      styles.catChip,
                      active && {
                        borderColor: tint,
                        backgroundColor: `${tint}18`,
                      },
                    ]}
                  >
                    <CategoryIcon icon={c.icon} color={tint} size={14} box={28} />
                    <Text style={[styles.catName, active && { color: tint }]}>{c.name}</Text>
                  </ScalePress>
                );
              })}
            </View>
          )}
        </FadeInUp>

        <FadeInUp delay={140}>
          <FormLabel>Struk (opsional)</FormLabel>
          <View style={styles.receiptActions}>
            <ScalePress
              style={styles.receiptBtn}
              onPress={() => pickReceipt(false)}
              disabled={uploadingReceipt}
            >
              <Ionicons name="images-outline" size={16} color={colors.brand} />
              <Text style={styles.receiptBtnText}>Galeri</Text>
            </ScalePress>
            <ScalePress
              style={styles.receiptBtn}
              onPress={() => pickReceipt(true)}
              disabled={uploadingReceipt}
            >
              <Ionicons name="camera-outline" size={16} color={colors.brand} />
              <Text style={styles.receiptBtnText}>Kamera</Text>
            </ScalePress>
            {receiptUrl ? (
              <ScalePress
                style={[styles.receiptBtn, styles.receiptBtnDanger]}
                onPress={() => setReceiptUrl(null)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.expense} />
                <Text style={styles.receiptBtnTextDanger}>Hapus</Text>
              </ScalePress>
            ) : null}
          </View>
          {uploadingReceipt ? (
            <ActivityIndicator color={colors.brand} style={{ marginVertical: 8 }} />
          ) : null}
          {receiptUrl && /\.pdf($|\?)/i.test(receiptUrl) ? (
            <View style={styles.receiptPdfBox}>
              <Ionicons name="document-text-outline" size={28} color={colors.brand} />
              <Text style={styles.receiptPdfText}>Struk PDF terlampir</Text>
              <Text style={styles.hint}>Buka di web untuk preview penuh</Text>
            </View>
          ) : receiptPreview ? (
            <Image source={receiptPreview} style={styles.receiptImage} resizeMode="cover" />
          ) : (
            <Text style={styles.hint}>Belum ada struk terlampir.</Text>
          )}

          <ScalePress style={styles.saveBtn} onPress={onSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.saveText}>
                  {isEdit ? 'Simpan perubahan' : isIncome ? 'Simpan pemasukan' : 'Simpan pengeluaran'}
                </Text>
              </>
            )}
          </ScalePress>

          <Pressable onPress={handleCancel} style={{ marginTop: 14 }}>
            <Text style={styles.cancel}>Batal</Text>
          </Pressable>
        </FadeInUp>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors, r: ReturnType<typeof useResponsive>) {
  return StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingTop: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: r.isCompact ? 8 : 10,
    marginBottom: 14,
    width: '100%',
  },
  typeCard: {
    flex: 1,
    alignSelf: 'stretch',
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: r.isCompact ? 10 : 14,
    minHeight: r.isCompact ? 128 : 140,
    overflow: 'hidden',
  },
  typeCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  typeGlyph: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  typeSymbol: { fontSize: 26, fontWeight: '900', lineHeight: 30 },
  typeLabel: {
    marginTop: 6,
    fontWeight: '900',
    color: colors.text,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  typeHint: { marginTop: 2, color: colors.faint, fontSize: 11, fontWeight: '600' },
  typePick: { marginTop: 10, fontWeight: '800', color: colors.faint, fontSize: 11 },
  amountRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 },
  calcBtn: {
    backgroundColor: colors.brand,
    borderRadius: 16,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dateBtn: {
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateBtnText: { fontWeight: '800', color: colors.text },
  dateBtnHint: { color: colors.brand, fontWeight: '800' },
  donePicker: { color: colors.brand, fontWeight: '700', textAlign: 'right' },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  catName: { fontWeight: '700', color: colors.text, fontSize: 13, marginLeft: 8 },
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  hint: { color: colors.faint, fontSize: 12, fontWeight: '600' },
  link: { marginTop: 8, color: colors.brand, fontWeight: '800' },
  receiptActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: colors.brandSoftBorder,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  receiptBtnDanger: {
    backgroundColor: colors.expenseSoft,
    borderColor: colors.expenseBorder,
  },
  receiptBtnText: { color: colors.brandDark, fontWeight: '800', fontSize: 13 },
  receiptBtnTextDanger: { color: colors.expense, fontWeight: '800', fontSize: 13 },
  receiptImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: colors.border,
  },
  receiptPdfBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.brandSoftBorder,
    backgroundColor: colors.brandSoft,
    marginBottom: 8,
    padding: 16,
  },
  receiptPdfText: { color: colors.brandDark, fontWeight: '800', fontSize: 14 },
  saveBtn: {
    marginTop: 18,
    backgroundColor: colors.brand,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancel: { textAlign: 'center', color: colors.muted, fontWeight: '700' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.expenseSoft,
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  error: { flex: 1, color: colors.expense, fontWeight: '700', fontSize: 13 },
});
}
