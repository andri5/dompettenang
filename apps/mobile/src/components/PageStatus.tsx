import { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '../theme';
import { useColors } from '../themeContext';

export function PageLoader({
  label = 'Memuat…',
  compact,
}: {
  label?: string;
  compact?: boolean;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.65)).current;

  useEffect(() => {
    const rotate = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.55,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    rotate.start();
    glow.start();
    return () => {
      rotate.stop();
      glow.stop();
    };
  }, [pulse, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.loaderWrap, compact && styles.loaderCompact]}>
      <Animated.View style={{ opacity: pulse, transform: [{ rotate }] }}>
        <View style={styles.loaderRing}>
          <Ionicons name="wallet" size={compact ? 18 : 24} color={colors.brand} />
        </View>
      </Animated.View>
      <Text style={styles.loaderLabel}>{label}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    loaderWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      gap: 14,
    },
    loaderCompact: { paddingVertical: 28 },
    loaderRing: {
      width: 56,
      height: 56,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: colors.brandSoftBorder,
      backgroundColor: colors.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loaderLabel: {
      color: colors.muted,
      fontWeight: '700',
      fontSize: 13,
    },
  });
}
