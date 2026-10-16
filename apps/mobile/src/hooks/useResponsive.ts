import { useMemo } from 'react';
import { useWindowDimensions, type ViewStyle } from 'react-native';
import {
  columnsFor,
  contentMaxWidthFor,
  getBreakpoint,
  moderateScale,
  moderateVerticalScale,
  pagePaddingFor,
  type Breakpoint,
} from '../lib/responsive';

export type ResponsiveValue = {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isCompact: boolean;
  isTablet: boolean;
  isLandscape: boolean;
  pagePadding: number;
  contentMaxWidth?: number;
  columns: number;
  /** Scale font/spacing from design base */
  ms: (size: number, factor?: number) => number;
  vs: (size: number, factor?: number) => number;
  /** Centered content shell for tablets / wide screens */
  contentStyle: ViewStyle;
  /** Horizontal page padding */
  pageStyle: ViewStyle;
};

export function useResponsive(): ResponsiveValue {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const breakpoint = getBreakpoint(width);
    const isCompact = breakpoint === 'xs';
    const isTablet = breakpoint === 'lg';
    const isLandscape = width > height;
    const pagePadding = pagePaddingFor(width);
    const contentMaxWidth = contentMaxWidthFor(width);
    const columns = columnsFor(width);

    const contentStyle: ViewStyle = {
      width: '100%',
      maxWidth: contentMaxWidth,
      alignSelf: 'center',
    };

    const pageStyle: ViewStyle = {
      paddingHorizontal: pagePadding,
    };

    return {
      width,
      height,
      breakpoint,
      isCompact,
      isTablet,
      isLandscape,
      pagePadding,
      contentMaxWidth,
      columns,
      ms: (size: number, factor = 0.4) => moderateScale(size, width, factor),
      vs: (size: number, factor = 0.35) => moderateVerticalScale(size, height, factor),
      contentStyle,
      pageStyle,
    };
  }, [width, height]);
}
