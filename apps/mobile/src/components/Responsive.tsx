import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

/** Centers content on tablet / wide screens and applies page padding. */
export function ResponsiveContent({
  children,
  style,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const r = useResponsive();
  return (
    <View style={[padded && r.pageStyle, style]}>
      <View style={r.contentStyle}>{children}</View>
    </View>
  );
}

/** Row that becomes a column on very compact phones when `stackOnCompact` is set. */
export function ResponsiveRow({
  children,
  style,
  stackOnCompact = false,
  gap = 8,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  stackOnCompact?: boolean;
  gap?: number;
}) {
  const r = useResponsive();
  const stacked = stackOnCompact && r.isCompact;
  return (
    <View
      style={[
        {
          flexDirection: stacked ? 'column' : 'row',
          gap: r.ms(gap),
          alignItems: stacked ? 'stretch' : 'center',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
