import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../themeContext';
import { useResponsive } from '../hooks/useResponsive';
import type { ThemeColors } from '../theme';

type Props = BottomTabBarProps & {
  onCapture: () => void;
};

const TAB_META: Record<
  string,
  { label: string; short: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }
> = {
  Dashboard: { label: 'Beranda', short: 'Home', icon: 'home-outline', iconActive: 'home' },
  Transactions: { label: 'Transaksi', short: 'List', icon: 'list-outline', iconActive: 'list' },
  Summary: { label: 'Ringkasan', short: 'Info', icon: 'pie-chart-outline', iconActive: 'pie-chart' },
  Profile: { label: 'Profil', short: 'Akun', icon: 'person-outline', iconActive: 'person' },
};

export function AppTabBar({ state, descriptors, navigation, onCapture }: Props) {
  const colors = useColors();
  const r = useResponsive();
  const styles = useMemo(() => createStyles(colors, r), [colors, r]);
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, r.isCompact ? 8 : 10);

  const leftNames = ['Dashboard', 'Transactions'];
  const rightNames = ['Summary', 'Profile'];
  const iconSize = r.isCompact ? 20 : r.isTablet ? 24 : 22;
  const camSize = r.isCompact ? 22 : 24;

  const renderTab = (routeName: string) => {
    const route = state.routes.find((routeItem) => routeItem.name === routeName);
    if (!route) return <View key={routeName} style={styles.tabItem} />;

    const routeIndex = state.routes.findIndex((routeItem) => routeItem.key === route.key);
    const focused = state.index === routeIndex;
    const { options } = descriptors[route.key];
    const meta = TAB_META[route.name] || {
      label: options.title || route.name,
      short: options.title || route.name,
      icon: 'ellipse-outline' as const,
      iconActive: 'ellipse' as const,
    };
    const label = r.isCompact ? meta.short : meta.label;

    return (
      <Pressable
        key={route.key}
        onPress={() => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        }}
        style={styles.tabItem}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
      >
        <Ionicons
          name={focused ? meta.iconActive : meta.icon}
          size={iconSize}
          color={focused ? colors.brand : colors.faint}
        />
        <Text
          style={[styles.tabLabel, focused && { color: colors.brand }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.shell, { paddingBottom: bottomInset }]}>
      <View style={[styles.tabRow, r.contentStyle, { maxWidth: r.contentMaxWidth ?? '100%' }]}>
        {leftNames.map(renderTab)}

        <Pressable
          onPress={onCapture}
          style={styles.captureSlot}
          accessibilityRole="button"
          accessibilityLabel="Foto struk"
        >
          <View style={styles.captureFab}>
            <Ionicons name="camera" size={camSize} color={colors.onBrand} />
          </View>
          <Text style={styles.captureLabel}>Foto Struk</Text>
        </Pressable>

        {rightNames.map(renderTab)}
      </View>
    </View>
  );
}

function createStyles(
  colors: ThemeColors,
  r: ReturnType<typeof useResponsive>
) {
  const fab = r.isCompact ? 48 : r.isTablet ? 56 : 52;
  return StyleSheet.create({
    shell: {
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: r.isCompact ? 4 : 6,
      alignItems: 'center',
    },
    tabRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: r.isCompact ? 2 : 4,
      minHeight: r.isCompact ? 52 : 56,
      width: '100%',
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: r.isCompact ? 4 : 6,
      gap: 2,
      minWidth: 0,
    },
    tabLabel: {
      fontSize: r.ms(r.isCompact ? 9 : 10, 0.3),
      fontWeight: '700',
      color: colors.faint,
      letterSpacing: 0.1,
      textAlign: 'center',
    },
    captureSlot: {
      width: r.isCompact ? 64 : 72,
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: 2,
    },
    captureFab: {
      width: fab,
      height: fab,
      borderRadius: fab / 2,
      backgroundColor: colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: r.isCompact ? -14 : -18,
      borderWidth: 3,
      borderColor: colors.surface,
      shadowColor: colors.brand,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    captureLabel: {
      marginTop: 2,
      fontSize: r.ms(r.isCompact ? 9 : 10, 0.3),
      fontWeight: '800',
      color: colors.brand,
    },
  });
}
