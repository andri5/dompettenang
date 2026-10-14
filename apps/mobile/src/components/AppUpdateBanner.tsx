/**
 * Banner when an EAS Update (OTA) is downloaded and ready to apply.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
  type AppStateStatus,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { useColors } from '../themeContext';
import type { ThemeColors } from '../theme';

async function checkAndFetchUpdate(): Promise<boolean> {
  if (__DEV__ || !Updates.isEnabled) return false;
  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return false;
    const fetched = await Updates.fetchUpdateAsync();
    return fetched.isNew;
  } catch {
    return false;
  }
}

export function AppUpdateBanner() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [ready, setReady] = useState(false);
  const [applying, setApplying] = useState(false);

  const runCheck = useCallback(async () => {
    const hasNew = await checkAndFetchUpdate();
    if (hasNew) setReady(true);
  }, []);

  useEffect(() => {
    void runCheck();
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') void runCheck();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [runCheck]);

  const onApply = async () => {
    if (applying) return;
    setApplying(true);
    try {
      await Updates.reloadAsync();
    } catch {
      setApplying(false);
    }
  };

  if (!ready) return null;

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 8) }]} pointerEvents="box-none">
      <Pressable
        style={styles.banner}
        onPress={onApply}
        accessibilityRole="button"
        accessibilityLabel="Terapkan pembaruan aplikasi"
      >
        <Ionicons name="cloud-download-outline" size={18} color={colors.onBrand} />
        <View style={styles.textCol}>
          <Text style={styles.title}>
            {applying ? 'Menerapkan pembaruan…' : 'Ada pembaruan siap dipasang'}
          </Text>
          <Text style={styles.sub}>
            {applying ? 'Sebentar ya' : 'Ketuk untuk sinkronkan fitur terbaru'}
          </Text>
        </View>
        {!applying ? (
          <Ionicons name="chevron-up" size={18} color={colors.onBrand} />
        ) : null}
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      paddingHorizontal: 12,
      paddingBottom: 4,
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.brand,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    textCol: { flex: 1, minWidth: 0 },
    title: {
      color: colors.onBrand,
      fontWeight: '800',
      fontSize: 13,
    },
    sub: {
      color: colors.onBrand,
      opacity: 0.85,
      fontWeight: '600',
      fontSize: 11,
      marginTop: 2,
    },
  });
}
