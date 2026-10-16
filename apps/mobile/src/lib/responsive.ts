/**
 * Responsive helpers for phone / large phone / tablet layouts.
 * Base design width: 375 (iPhone-ish).
 */

import { PixelRatio } from 'react-native';

export const BASE_WIDTH = 375;
export const BASE_HEIGHT = 812;

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg';

export function getBreakpoint(width: number): Breakpoint {
  if (width < 360) return 'xs';
  if (width < 400) return 'sm';
  if (width < 600) return 'md';
  return 'lg';
}

export function scale(size: number, width: number) {
  return (width / BASE_WIDTH) * size;
}

/** Soft scale — avoids huge jumps on tablets */
export function moderateScale(size: number, width: number, factor = 0.4) {
  const scaled = scale(size, width);
  return PixelRatio.roundToNearestPixel(size + (scaled - size) * factor);
}

export function verticalScale(size: number, height: number) {
  return (height / BASE_HEIGHT) * size;
}

export function moderateVerticalScale(size: number, height: number, factor = 0.35) {
  const scaled = verticalScale(size, height);
  return PixelRatio.roundToNearestPixel(size + (scaled - size) * factor);
}

export function pagePaddingFor(width: number) {
  if (width < 360) return 12;
  if (width < 400) return 16;
  if (width < 600) return 20;
  return 28;
}

export function contentMaxWidthFor(width: number) {
  if (width >= 900) return 720;
  if (width >= 600) return 560;
  return undefined;
}

export function columnsFor(width: number, prefer = 2) {
  if (width >= 700) return prefer;
  return 1;
}
