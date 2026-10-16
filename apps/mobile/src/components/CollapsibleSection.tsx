import { useState, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { radii, spacing, type ThemeColors } from '../theme';
import { useColors } from '../themeContext';

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  count,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  count?: number;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title}>{title}</Text>
          {typeof count === 'number' ? (
            <Text style={styles.meta}>{count} item</Text>
          ) : null}
        </View>
        <View style={styles.toggle}>
          <Text style={styles.toggleText}>{open ? 'Sembunyikan' : 'Tampilkan'}</Text>
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.muted}
          />
        </View>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    title: { fontWeight: '800', color: colors.text, fontSize: 15 },
    meta: { marginTop: 1, color: colors.faint, fontSize: 11, fontWeight: '600' },
    toggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.bg,
      borderRadius: radii.pill,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    toggleText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
    body: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 12,
      gap: spacing.sm,
    },
  });
}
