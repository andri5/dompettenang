import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useColors } from '../themeContext';
import { useResponsive } from '../hooks/useResponsive';
import { radii, spacing, type ThemeColors } from '../theme';
import { FadeInUp, ScalePress } from '../components/motion';
import { PageLoader } from '../components/PageStatus';
import { FormDialog, useDialog } from '../components/AppDialog';
import { AppTextInput, FormLabel } from '../components/ui';
import {
  getSavingsGoals,
  createSavingsGoal,
  addSavingsAmount,
  updateSavingsGoal,
  deleteSavingsGoal,
  type SavingsGoal,
} from '../lib/savings';
import { useAuth } from '../authContext';
import { hasProAccess } from '../lib/plan';
import { ProFeatureLock } from '../components/ProFeatureLock';

function fmtN(n: number) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
}

export function SavingsScreen() {
  const colors = useColors();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r), [colors, r]);
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const { user } = useAuth();
  const isPro = hasProAccess(user);

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [addGoal, setAddGoal] = useState<SavingsGoal | null>(null);
  const [addAmt, setAddAmt] = useState('');
  const [adding, setAdding] = useState(false);

  const resetForm = () => {
    setName('');
    setTarget('');
    setDeadline('');
  };

  const load = useCallback(async () => {
    if (!isPro) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await getSavingsGoals();
      setGoals(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isPro]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!isPro) {
    return (
      <ProFeatureLock
        title="Target Tabungan"
        message="Fitur Pro Lifetime. Budget bulanan tetap gratis. Upgrade untuk pantau goal saving."
      />
    );
  }

  const openEdit = (goal: SavingsGoal) => {
    setEditGoal(goal);
    setName(goal.name);
    setTarget(String(Math.round(goal.targetAmount)));
    setDeadline(goal.deadline || '');
  };

  const closeCreate = () => {
    const hasDraft = Boolean(name.trim() || target.trim() || deadline.trim());
    if (!hasDraft) {
      setShowCreate(false);
      return;
    }
    showDialog({
      variant: 'confirm',
      title: 'Batalkan?',
      message: 'Perubahan belum disimpan.',
      showCancel: true,
      cancelLabel: 'Tetap',
      confirmLabel: 'Keluar',
      onConfirm: () => {
        setShowCreate(false);
        resetForm();
      },
    });
  };

  const closeEdit = () => {
    if (!editGoal) return;
    const unchanged =
      name.trim() === editGoal.name &&
      target === String(Math.round(editGoal.targetAmount)) &&
      (deadline || '') === (editGoal.deadline || '');

    if (unchanged) {
      setEditGoal(null);
      resetForm();
      return;
    }

    showDialog({
      variant: 'confirm',
      title: 'Batalkan?',
      message: 'Perubahan belum disimpan.',
      showCancel: true,
      cancelLabel: 'Tetap',
      confirmLabel: 'Keluar',
      onConfirm: () => {
        setEditGoal(null);
        resetForm();
      },
    });
  };

  const closeAdd = () => {
    if (!addAmt.trim()) {
      setAddGoal(null);
      return;
    }
    showDialog({
      variant: 'confirm',
      title: 'Batalkan?',
      message: 'Perubahan belum disimpan.',
      showCancel: true,
      cancelLabel: 'Tetap',
      confirmLabel: 'Keluar',
      onConfirm: () => {
        setAddGoal(null);
        setAddAmt('');
      },
    });
  };

  const handleCreate = async () => {
    const parsed = Number(target);
    if (!name.trim() || !parsed) {
      showDialog({
        variant: 'warning',
        title: 'Data belum lengkap',
        message: 'Nama dan target harus diisi.',
        confirmLabel: 'Saya mengerti',
      });
      return;
    }

    setCreating(true);
    try {
      await createSavingsGoal({
        name: name.trim(),
        targetAmount: parsed,
        deadline: deadline || null,
      });
      setShowCreate(false);
      resetForm();
      load();
      showDialog({
        variant: 'success',
        title: 'Target dibuat',
        message: 'Target tabungan baru sudah ditambahkan.',
        confirmLabel: 'Saya mengerti',
      });
    } catch {
      showDialog({
        variant: 'error',
        title: 'Gagal membuat target',
        message: 'Coba lagi beberapa saat.',
        confirmLabel: 'Saya mengerti',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editGoal) return;
    const parsed = Number(target);
    if (!name.trim() || !parsed) {
      showDialog({
        variant: 'warning',
        title: 'Data belum lengkap',
        message: 'Nama dan target harus diisi.',
        confirmLabel: 'Saya mengerti',
      });
      return;
    }
    if (parsed < editGoal.savedAmount) {
      showDialog({
        variant: 'warning',
        title: 'Target terlalu kecil',
        message: 'Target tidak boleh lebih kecil dari jumlah yang sudah terkumpul.',
        confirmLabel: 'Saya mengerti',
      });
      return;
    }

    setUpdating(true);
    try {
      await updateSavingsGoal(editGoal.id, {
        name: name.trim(),
        targetAmount: parsed,
        deadline: deadline || null,
      });
      setEditGoal(null);
      resetForm();
      load();
      showDialog({
        variant: 'success',
        title: 'Target diperbarui',
        message: 'Perubahan target tabungan sudah disimpan.',
        confirmLabel: 'Saya mengerti',
      });
    } catch {
      showDialog({
        variant: 'error',
        title: 'Gagal memperbarui',
        message: 'Coba lagi beberapa saat.',
        confirmLabel: 'Saya mengerti',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleAdd = async () => {
    if (!addGoal) return;
    const parsed = Number(addAmt);
    if (!parsed || parsed <= 0) {
      showDialog({
        variant: 'warning',
        title: 'Jumlah tidak valid',
        message: 'Jumlah harus lebih dari 0.',
        confirmLabel: 'Saya mengerti',
      });
      return;
    }

    setAdding(true);
    try {
      const updated = await addSavingsAmount(addGoal.id, parsed);
      if (updated.isCompleted) {
        showDialog({
          variant: 'success',
          title: 'Selamat!',
          message: `Target "${updated.name}" tercapai!`,
          confirmLabel: 'Saya mengerti',
        });
      }
      setAddGoal(null);
      setAddAmt('');
      load();
    } catch {
      showDialog({
        variant: 'error',
        title: 'Gagal menambah tabungan',
        message: 'Coba lagi beberapa saat.',
        confirmLabel: 'Saya mengerti',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (goal: SavingsGoal) => {
    showDialog({
      variant: 'danger',
      title: 'Hapus target?',
      message: `"${goal.name}" akan dihapus permanen.`,
      showCancel: true,
      cancelLabel: 'Batal',
      confirmLabel: 'Hapus',
      onConfirm: async () => {
        try {
          await deleteSavingsGoal(goal.id);
          load();
          showDialog({
            variant: 'success',
            title: 'Target dihapus',
            message: 'Target tabungan sudah dihapus.',
            confirmLabel: 'Saya mengerti',
          });
        } catch {
          showDialog({
            variant: 'error',
            title: 'Gagal menghapus',
            message: 'Coba lagi beberapa saat.',
            confirmLabel: 'Saya mengerti',
          });
        }
      },
    });
  };

  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  if (loading) return <PageLoader />;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <FlatList
        data={goals}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.brand}
          />
        }
        ListHeaderComponent={
          goals.length > 0 ? (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.summaryLabel}>Terkumpul</Text>
                  <Text style={[styles.summaryValue, { color: colors.brand }]}>{fmtN(totalSaved)}</Text>
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Target</Text>
                  <Text style={styles.summaryValue}>{fmtN(totalTarget)}</Text>
                </View>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="flag-outline" size={48} color={colors.textSoft} />
            <Text style={styles.emptyTitle}>Belum ada target tabungan</Text>
            <Text style={styles.emptyHint}>Buat target untuk menabung</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <FadeInUp delay={index * 60}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Ionicons name="flag" size={16} color={colors.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.deadline ? (
                    <Text style={styles.cardDeadline}>Deadline: {item.deadline}</Text>
                  ) : null}
                </View>
                {item.isCompleted ? (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                ) : null}
              </View>

              <View style={styles.progressRow}>
                <Text style={styles.progressText}>{fmtN(item.savedAmount)} terkumpul</Text>
                <Text style={styles.progressPct}>{item.percentSaved}%</Text>
              </View>
              <View style={styles.progressBg}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, item.percentSaved)}%` as `${number}%`,
                      backgroundColor: item.isCompleted ? '#22c55e' : colors.brand,
                    },
                  ]}
                />
              </View>
              <Text style={styles.remaining}>
                Target: {fmtN(item.targetAmount)} · Sisa: {fmtN(item.remaining)}
              </Text>

              <View style={styles.cardActions}>
                {!item.isCompleted ? (
                  <ScalePress>
                    <Pressable
                      style={styles.addBtn}
                      onPress={() => {
                        setAddGoal(item);
                        setAddAmt('');
                      }}
                    >
                      <Ionicons name="add" size={14} color={colors.brand} />
                      <Text style={styles.addBtnText}>Tambah</Text>
                    </Pressable>
                  </ScalePress>
                ) : null}
                <ScalePress>
                  <Pressable style={styles.editBtn} onPress={() => openEdit(item)}>
                    <Ionicons name="create-outline" size={14} color={colors.brand} />
                  </Pressable>
                </ScalePress>
                <ScalePress>
                  <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                    <Ionicons name="trash-outline" size={14} color={colors.dangerText} />
                  </Pressable>
                </ScalePress>
              </View>
            </View>
          </FadeInUp>
        )}
      />

      <Pressable
        style={styles.fab}
        onPress={() => {
          resetForm();
          setShowCreate(true);
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <FormDialog
        visible={showCreate}
        title="Buat Target Tabungan"
        subtitle="Tentukan nama dan nominal target tabunganmu."
        variant="info"
        confirmLabel="Simpan"
        loading={creating}
        onCancel={closeCreate}
        onConfirm={handleCreate}
        onRequestClose={closeCreate}
      >
        <FormLabel>Nama target</FormLabel>
        <AppTextInput
          icon="flag-outline"
          placeholder="Misal: Liburan ke Bali"
          value={name}
          onChangeText={setName}
        />
        <FormLabel>Target nominal</FormLabel>
        <AppTextInput
          icon="cash-outline"
          placeholder="Contoh: 5000000"
          keyboardType="numeric"
          value={target}
          onChangeText={(v) => setTarget(v.replace(/[^0-9]/g, ''))}
        />
        <FormLabel>Deadline (opsional)</FormLabel>
        <AppTextInput
          icon="calendar-outline"
          placeholder="YYYY-MM-DD"
          value={deadline}
          onChangeText={setDeadline}
        />
      </FormDialog>

      <FormDialog
        visible={!!editGoal}
        title="Edit Target Tabungan"
        subtitle={
          editGoal
            ? `Sudah terkumpul: ${fmtN(editGoal.savedAmount)}. Ubah nama, target, atau deadline.`
            : undefined
        }
        variant="info"
        confirmLabel="Simpan"
        loading={updating}
        onCancel={closeEdit}
        onConfirm={handleUpdate}
        onRequestClose={closeEdit}
      >
        <FormLabel>Nama target</FormLabel>
        <AppTextInput
          icon="flag-outline"
          placeholder="Misal: Liburan ke Bali"
          value={name}
          onChangeText={setName}
        />
        <FormLabel>Target nominal</FormLabel>
        <AppTextInput
          icon="cash-outline"
          placeholder="Contoh: 5000000"
          keyboardType="numeric"
          value={target}
          onChangeText={(v) => setTarget(v.replace(/[^0-9]/g, ''))}
        />
        <FormLabel>Deadline (opsional)</FormLabel>
        <AppTextInput
          icon="calendar-outline"
          placeholder="YYYY-MM-DD"
          value={deadline}
          onChangeText={setDeadline}
        />
      </FormDialog>

      <FormDialog
        visible={!!addGoal}
        title="Tambah Tabungan"
        subtitle={addGoal ? `Sisa target: ${fmtN(addGoal.remaining)}` : undefined}
        variant="info"
        confirmLabel="Tambah"
        loading={adding}
        onCancel={closeAdd}
        onConfirm={handleAdd}
        onRequestClose={closeAdd}
      >
        <FormLabel>Jumlah tabungan</FormLabel>
        <AppTextInput
          icon="wallet-outline"
          placeholder="Masukkan nominal"
          keyboardType="numeric"
          value={addAmt}
          onChangeText={(v) => setAddAmt(v.replace(/[^0-9]/g, ''))}
        />
      </FormDialog>
    </View>
  );
}

function createStyles(colors: ThemeColors, r: ReturnType<typeof useResponsive>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    list: { padding: spacing.md },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryLabel: { fontSize: 11, fontWeight: '600', color: colors.textSoft, marginBottom: 2 },
    summaryValue: { fontSize: 18, fontWeight: '800', color: colors.text },
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 12 },
    emptyHint: { fontSize: 13, color: colors.textSoft, marginTop: 4 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    cardIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardName: { fontSize: 14, fontWeight: '700', color: colors.text },
    cardDeadline: { fontSize: 11, color: colors.textSoft },
    completedBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#22c55e',
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    progressText: { fontSize: 11, color: colors.textSoft },
    progressPct: { fontSize: 11, fontWeight: '700', color: colors.text },
    progressBg: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      marginBottom: 4,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 4 },
    remaining: { fontSize: 11, color: colors.textSoft, marginBottom: 10 },
    cardActions: { flexDirection: 'row', gap: 8 },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: colors.brandSoft,
    },
    addBtnText: { fontSize: 12, fontWeight: '700', color: colors.brand },
    editBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: colors.brandSoft,
    },
    deleteBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: colors.dangerBg,
    },
    fab: {
      position: 'absolute',
      bottom: 80,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
  });
}
