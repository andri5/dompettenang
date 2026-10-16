import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, type ThemeColors } from '../theme';
import { useColors } from '../themeContext';

export function FadeInUp({
  children,
  delay = 0,
  style,
  distance = 14,
}: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  distance?: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, distance, opacity, translateY]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[{ opacity, transform: [{ translateY }] }, style]}
    >
      {children}
    </Animated.View>
  );
}

export function PopIn({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        delay,
        friction: 7,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, scale]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[{ opacity, transform: [{ scale }] }, style]}
    >
      {children}
    </Animated.View>
  );
}

export function ScalePress({
  children,
  onPress,
  onLongPress,
  style,
  disabled,
}: {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const flat = StyleSheet.flatten(style) || {};

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 6,
      tension: 200,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 160,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      style={style}
    >
      <Animated.View
        style={{
          transform: [{ scale }],
          flexDirection: flat.flexDirection ?? 'column',
          alignItems: flat.alignItems,
          justifyContent: flat.justifyContent,
          gap: flat.gap,
          width: flat.flex === 1 || flat.width === '100%' ? '100%' : undefined,
        }}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

export function PulseGlow({
  children,
  style,
  active = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  active?: boolean;
}) {
  const glow = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (!active) {
      glow.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.65,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, glow]);

  return (
    <Animated.View style={[{ opacity: glow }, style]}>{children}</Animated.View>
  );
}

/** Compact animated bar fill (0–1) */
export function AnimatedBar({
  progress,
  color,
  height = 6,
}: {
  progress: number;
  color: string;
  height?: number;
}) {
  const colors = useColors();
  const barStyles = useMemo(() => createBarStyles(colors), [colors]);
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: Math.min(1, Math.max(0.04, progress)),
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, width]);

  return (
    <View style={[barStyles.track, { height, borderRadius: height }]}>
      <Animated.View
        style={[
          barStyles.fill,
          {
            height,
            borderRadius: height,
            backgroundColor: color,
            width: width.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

/** Compact eye-catching hide/show amounts control */
export function PrivacyEyeToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  const colors = useColors();
  const eyeStyles = useMemo(() => createEyeStyles(colors), [colors]);
  const pulse = useRef(new Animated.Value(1)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(spin, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(spin, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();

    if (!visible) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.08,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    pulse.setValue(1);
  }, [visible, pulse, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-12deg'],
  });

  return (
    <ScalePress onPress={onToggle}>
      <Animated.View
        style={[
          eyeStyles.wrap,
          !visible && eyeStyles.wrapHidden,
          { transform: [{ scale: pulse }, { rotate }] },
        ]}
      >
        {!visible ? <View style={eyeStyles.ring} /> : null}
        <Ionicons
          name={visible ? 'eye-outline' : 'eye-off'}
          size={18}
          color={visible ? colors.brand : colors.onBrand}
        />
        <Text style={[eyeStyles.label, !visible && eyeStyles.labelHidden]}>
          {visible ? 'Rp' : '•••'}
        </Text>
      </Animated.View>
    </ScalePress>
  );
}

function createBarStyles(colors: ThemeColors) {
  return StyleSheet.create({
    track: {
      width: '100%',
      backgroundColor: colors.track,
      overflow: 'hidden',
    },
    fill: {},
  });
}

function createEyeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      minWidth: 52,
      height: 36,
      paddingHorizontal: 10,
      borderRadius: radii.pill,
      backgroundColor: colors.brandSoft,
      borderWidth: 1.5,
      borderColor: colors.brandSoftBorder,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    wrapHidden: {
      backgroundColor: colors.brand,
      borderColor: colors.brandBright,
    },
    ring: {
      ...StyleSheet.absoluteFill,
      borderRadius: radii.pill,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.35)',
    },
    label: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.brandDark,
      letterSpacing: 0.3,
    },
    labelHidden: { color: colors.onBrand },
  });
}
