import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing, type ThemeColors } from '../theme';
import { useColors, useTheme } from '../themeContext';

export function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const box = size === 'sm' ? 32 : size === 'lg' ? 56 : 44;
  const icon = size === 'sm' ? 16 : size === 'lg' ? 28 : 22;
  return (
    <View style={styles.brandRow}>
      <View
        style={[
          styles.brandMark,
          {
            width: box,
            height: box,
            borderRadius: box * 0.28,
          },
        ]}
      >
        <Ionicons name="wallet" size={icon} color={colors.onBrand} />
      </View>
      <View>
        <Text
          style={[
            typography.brand,
            size === 'sm' && { fontSize: 12 },
            size === 'lg' && { fontSize: 16 },
          ]}
        >
          Dompet Tenang
        </Text>
        {size === 'lg' ? <Text style={styles.brandTag}>Finance OS</Text> : null}
      </View>
    </View>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.pageHeader}>
      <View style={{ flex: 1, minWidth: 0 }}>
        {eyebrow ? <Text style={typography.eyebrow}>{eyebrow}</Text> : <BrandMark size="sm" />}
        <Text style={[typography.title, { marginTop: 4 }]}>{title}</Text>
        {subtitle ? <Text style={[typography.subtitle, { marginTop: 4 }]}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.pageHeaderRight}>{right}</View> : null}
    </View>
  );
}

export function Card({
  children,
  style,
  soft,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  soft?: boolean;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={[styles.card, soft && styles.cardSoft, style]}>{children}</View>;
}

export function FormLabel({ children }: { children: ReactNode }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Text style={styles.formLabel}>{children}</Text>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const textColor =
    variant === 'outline' || variant === 'ghost' ? colors.brand : colors.onBrand;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && styles.btnPrimary,
        variant === 'outline' && styles.btnOutline,
        variant === 'danger' && styles.btnDanger,
        variant === 'ghost' && styles.btnGhost,
        (disabled || loading) && { opacity: 0.55 },
        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
      ]}
    >
      {loading ? (
        <Text style={[styles.btnText, { color: textColor }]}>…</Text>
      ) : (
        <View style={styles.btnInner}>
          {icon ? <Ionicons name={icon} size={18} color={textColor} /> : null}
          <Text style={[styles.btnText, { color: textColor }]}>{label}</Text>
          {variant === 'primary' ? (
            <Ionicons name="arrow-forward" size={16} color={textColor} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

export function AppTextInput({
  style,
  icon,
  ...props
}: TextInputProps & { icon?: keyof typeof Ionicons.glyphMap }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.fieldWrap, focused && styles.fieldWrapFocused, style as ViewStyle]}>
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={focused ? colors.brand : colors.faint}
          style={styles.fieldIcon}
        />
      ) : null}
      <TextInput
        placeholderTextColor={colors.faint}
        underlineColorAndroid="transparent"
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[styles.fieldInput, !icon && styles.fieldInputNoIcon]}
      />
    </View>
  );
}

export function PasswordInput({
  style,
  ...props
}: Omit<TextInputProps, 'secureTextEntry'> & { icon?: keyof typeof Ionicons.glyphMap }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.fieldWrap, focused && styles.fieldWrapFocused, style as ViewStyle]}>
      <Ionicons
        name="lock-closed-outline"
        size={18}
        color={focused ? colors.brand : colors.faint}
        style={styles.fieldIcon}
      />
      <TextInput
        placeholderTextColor={colors.faint}
        underlineColorAndroid="transparent"
        {...props}
        secureTextEntry={!visible}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={styles.fieldInput}
      />
      <Pressable
        style={styles.eyeBtn}
        onPress={() => setVisible((v) => !v)}
        hitSlop={8}
        accessibilityLabel={visible ? 'Sembunyikan password' : 'Tampilkan password'}
      >
        <View style={styles.eyeChip}>
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={colors.brand}
          />
        </View>
      </Pressable>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    brandMark: {
      backgroundColor: colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.brandBright,
      shadowColor: colors.brand,
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    brandTag: {
      marginTop: 2,
      fontSize: 10,
      fontWeight: '700',
      color: colors.muted,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    pageHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    pageHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      marginBottom: spacing.md,
      shadowColor: '#07111f',
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    cardSoft: {
      backgroundColor: colors.brandSoft,
      borderColor: colors.brandSoftBorder,
    },
    formLabel: {
      fontWeight: '800',
      color: colors.muted,
      marginBottom: 8,
      marginTop: 4,
      fontSize: 11,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    btn: {
      borderRadius: 16,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    btnPrimary: {
      backgroundColor: colors.brand,
      shadowColor: colors.brand,
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    btnOutline: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.brand,
    },
    btnDanger: { backgroundColor: colors.expense },
    btnGhost: { backgroundColor: 'transparent' },
    btnText: { fontWeight: '800', fontSize: 15 },
    fieldWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 12,
      minHeight: 52,
      marginBottom: 12,
      width: '100%',
    },
    fieldWrapFocused: {
      borderColor: colors.brand,
      backgroundColor: colors.brandSoft,
    },
    fieldIcon: { marginRight: 8 },
    fieldInput: {
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 0,
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
      paddingHorizontal: 0,
      margin: 0,
    },
    fieldInputNoIcon: {
      paddingLeft: 2,
    },
    eyeBtn: { marginLeft: 4, zIndex: 2 },
    eyeChip: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.brandSoftBorder,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
    },
    chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
    chipText: { fontSize: 13, fontWeight: '600', color: colors.muted },
    chipTextActive: { color: colors.onBrand },
  });
}
