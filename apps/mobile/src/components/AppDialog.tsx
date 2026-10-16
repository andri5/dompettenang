import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Easing,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, type ThemeColors } from '../theme';
import { useColors } from '../themeContext';
import { useResponsive } from '../hooks/useResponsive';

export type DialogVariant =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'confirm'
  | 'danger'
  | 'offline'
  | 'maintenance';

export type DialogOptions = {
  title: string;
  message?: string;
  variant?: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
};

type DialogContextValue = {
  showDialog: (options: DialogOptions) => void;
  hideDialog: () => void;
};

const DialogContext = createContext<DialogContextValue>({
  showDialog: () => undefined,
  hideDialog: () => undefined,
});

export function useDialog() {
  return useContext(DialogContext);
}

function getVariantTheme(colors: ThemeColors): Record<
  DialogVariant,
  {
    icon: keyof typeof Ionicons.glyphMap;
    accent: string;
    soft: string;
    glow: string;
    primaryBg: string;
  }
> {
  return {
    success: {
      icon: 'checkmark-circle',
      accent: colors.income,
      soft: colors.incomeSoft,
      glow: 'rgba(22,163,74,0.35)',
      primaryBg: colors.income,
    },
    error: {
      icon: 'close-circle',
      accent: colors.expense,
      soft: colors.expenseSoft,
      glow: 'rgba(226,75,74,0.35)',
      primaryBg: colors.expense,
    },
    warning: {
      icon: 'warning',
      accent: colors.amber,
      soft: colors.amberSoft,
      glow: 'rgba(217,119,6,0.35)',
      primaryBg: colors.amber,
    },
    info: {
      icon: 'information-circle',
      accent: colors.brand,
      soft: colors.brandSoft,
      glow: 'rgba(15,155,142,0.35)',
      primaryBg: colors.brand,
    },
    confirm: {
      icon: 'help-circle',
      accent: colors.brand,
      soft: colors.brandSoft,
      glow: 'rgba(15,155,142,0.35)',
      primaryBg: colors.brand,
    },
    danger: {
      icon: 'trash',
      accent: colors.expense,
      soft: colors.expenseSoft,
      glow: 'rgba(226,75,74,0.4)',
      primaryBg: colors.expense,
    },
    offline: {
      icon: 'cloud-offline',
      accent: colors.expense,
      soft: colors.expenseSoft,
      glow: 'rgba(226,75,74,0.4)',
      primaryBg: colors.brand,
    },
    maintenance: {
      icon: 'construct',
      accent: colors.amber,
      soft: colors.amberSoft,
      glow: 'rgba(217,119,6,0.4)',
      primaryBg: colors.brand,
    },
  };
}

export function FancyDialog({
  visible,
  title,
  message,
  variant = 'info',
  confirmLabel = 'OK',
  cancelLabel = 'Batal',
  showCancel = false,
  onConfirm,
  onCancel,
  onRequestClose,
}: DialogOptions & {
  visible: boolean;
  onRequestClose: () => void;
}) {
  const colors = useColors();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r), [colors, r]);
  const theme = getVariantTheme(colors)[variant];
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.86)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      scale.setValue(0.86);
      bounce.setValue(0);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 140,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(bounce, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.back(1.6)),
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(ring, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ring, {
            toValue: 0.35,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [visible, bounce, opacity, ring, scale]);

  const iconScale = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onRequestClose}>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <View style={[styles.glowOrb, { backgroundColor: theme.glow }]} />
        <View style={[styles.glowOrbB, { backgroundColor: theme.glow }]} />

        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <View style={[styles.accentBar, { backgroundColor: theme.accent }]} />

          <View style={styles.iconStage}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  borderColor: theme.accent,
                  opacity: ring,
                  transform: [{ scale: ring.interpolate({ inputRange: [0.35, 1], outputRange: [1, 1.25] }) }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.iconBox,
                { backgroundColor: theme.soft, transform: [{ scale: iconScale }] },
              ]}
            >
              <Ionicons name={theme.icon} size={34} color={theme.accent} />
            </Animated.View>
          </View>

          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={[styles.actions, showCancel && styles.actionsRow]}>
            {showCancel ? (
              <Pressable
                style={[styles.secondaryBtn, styles.actionHalf]}
                onPress={() => {
                  const fn = onCancel;
                  onRequestClose();
                  setTimeout(() => fn?.(), 80);
                }}
              >
                <Text style={styles.secondaryText}>{cancelLabel}</Text>
              </Pressable>
            ) : null}

            <Pressable
              style={[
                styles.primaryBtn,
                showCancel && styles.actionHalf,
                { backgroundColor: theme.primaryBg },
              ]}
              onPress={() => {
                const fn = onConfirm;
                onRequestClose();
                setTimeout(() => fn?.(), 80);
              }}
            >
              <Text style={styles.primaryText}>{confirmLabel}</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export type FormDialogProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  variant?: DialogVariant;
  cancelLabel?: string;
  confirmLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onRequestClose: () => void;
  children: ReactNode;
};

export function FormDialog({
  visible,
  title,
  subtitle,
  variant = 'info',
  cancelLabel = 'Batal',
  confirmLabel = 'Simpan',
  loading = false,
  onCancel,
  onConfirm,
  onRequestClose,
  children,
}: FormDialogProps) {
  const colors = useColors();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r), [colors, r]);
  const theme = getVariantTheme(colors)[variant];
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.86)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      scale.setValue(0.86);
      bounce.setValue(0);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 140,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(bounce, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.back(1.6)),
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(ring, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ring, {
            toValue: 0.35,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [visible, bounce, opacity, ring, scale]);

  const iconScale = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onRequestClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.backdrop, { opacity }]}>
          <View style={[styles.glowOrb, { backgroundColor: theme.glow }]} />
          <View style={[styles.glowOrbB, { backgroundColor: theme.glow }]} />

          <Animated.View style={[styles.formCard, { transform: [{ scale }] }]}>
            <View style={[styles.accentBar, { backgroundColor: theme.accent }]} />

            <View style={styles.iconStage}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    borderColor: theme.accent,
                    opacity: ring,
                    transform: [
                      { scale: ring.interpolate({ inputRange: [0.35, 1], outputRange: [1, 1.25] }) },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.iconBox,
                  { backgroundColor: theme.soft, transform: [{ scale: iconScale }] },
                ]}
              >
                <Ionicons name={theme.icon} size={34} color={theme.accent} />
              </Animated.View>
            </View>

            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.message}>{subtitle}</Text> : null}

            <ScrollView
              style={styles.formBody}
              contentContainerStyle={styles.formBodyContent}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>

            <View style={[styles.actions, styles.actionsRow]}>
              <Pressable
                style={[styles.secondaryBtn, styles.actionHalf]}
                onPress={onCancel}
                disabled={loading}
              >
                <Text style={styles.secondaryText}>{cancelLabel}</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.primaryBtn,
                  styles.actionHalf,
                  { backgroundColor: theme.primaryBg, opacity: loading ? 0.85 : 1 },
                ]}
                onPress={onConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.primaryText}>{confirmLabel}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<DialogOptions>({ title: '' });

  const hideDialog = useCallback(() => setVisible(false), []);

  const showDialog = useCallback((next: DialogOptions) => {
    setOptions(next);
    setVisible(true);
  }, []);

  const value = useMemo(() => ({ showDialog, hideDialog }), [showDialog, hideDialog]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      <FancyDialog
        visible={visible}
        title={options.title}
        message={options.message}
        variant={options.variant || 'info'}
        confirmLabel={options.confirmLabel}
        cancelLabel={options.cancelLabel}
        showCancel={options.showCancel}
        onConfirm={options.onConfirm}
        onCancel={options.onCancel}
        onRequestClose={hideDialog}
      />
    </DialogContext.Provider>
  );
}

function createStyles(colors: ThemeColors, r: ReturnType<typeof useResponsive>) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(7,17,31,0.62)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: r.pagePadding,
      overflow: 'hidden',
    },
    glowOrb: {
      position: 'absolute',
      top: '18%',
      width: 220,
      height: 220,
      borderRadius: 110,
    },
    glowOrbB: {
      position: 'absolute',
      bottom: '16%',
      right: -40,
      width: 180,
      height: 180,
      borderRadius: 90,
      opacity: 0.7,
    },
    card: {
      width: '100%',
      maxWidth: r.isTablet ? 420 : 360,
      backgroundColor: colors.surface,
      borderRadius: 28,
      paddingHorizontal: r.ms(22),
      paddingTop: 10,
      paddingBottom: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.65)',
      shadowColor: '#07111f',
      shadowOpacity: 0.28,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 16 },
      elevation: 12,
      overflow: 'hidden',
    },
    accentBar: {
      alignSelf: 'stretch',
      height: 4,
      borderRadius: 999,
      marginBottom: 18,
    },
    iconStage: {
      width: 96,
      height: 96,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
      alignSelf: 'center',
    },
    pulseRing: {
      position: 'absolute',
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 2,
    },
    iconBox: {
      width: 72,
      height: 72,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: r.ms(20),
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    message: {
      marginTop: 8,
      fontSize: r.ms(14),
      lineHeight: 21,
      color: colors.muted,
      textAlign: 'center',
    },
    actions: { width: '100%', marginTop: 20, gap: 8 },
    actionsRow: { flexDirection: 'row', alignItems: 'stretch' },
    actionHalf: { flex: 1 },
    primaryBtn: {
      borderRadius: radii.lg,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    primaryText: { color: '#fff', fontWeight: '800', fontSize: r.ms(15) },
    secondaryBtn: {
      borderRadius: radii.lg,
      paddingVertical: 14,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    secondaryText: { color: colors.muted, fontWeight: '700', fontSize: r.ms(14) },
    formCard: {
      width: '100%',
      maxWidth: r.isTablet ? 420 : 360,
      maxHeight: '88%',
      backgroundColor: colors.surface,
      borderRadius: 28,
      paddingHorizontal: r.ms(22),
      paddingTop: 10,
      paddingBottom: 20,
      alignItems: 'stretch',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.65)',
      shadowColor: '#07111f',
      shadowOpacity: 0.28,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 16 },
      elevation: 12,
      overflow: 'hidden',
    },
    formBody: { width: '100%', maxHeight: 280, marginTop: 16 },
    formBodyContent: { gap: 10, paddingBottom: 4 },
  });
}
