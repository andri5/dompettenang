import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { useColors } from '../themeContext';

/** Lucide-style keys (shared with web) → Ionicons */
const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  utensils: 'restaurant-outline',
  car: 'car-outline',
  'shopping-bag': 'bag-handle-outline',
  'gamepad-2': 'game-controller-outline',
  'heart-pulse': 'heart-outline',
  'graduation-cap': 'school-outline',
  home: 'home-outline',
  zap: 'flash-outline',
  plane: 'airplane-outline',
  gift: 'gift-outline',
  'more-horizontal': 'ellipsis-horizontal',
  wallet: 'wallet-outline',
  briefcase: 'briefcase-outline',
  laptop: 'laptop-outline',
  'line-chart': 'trending-up-outline',
  'piggy-bank': 'cash-outline',
  sparkles: 'sparkles',
  banknote: 'cash-outline',
};

const EMOJI_TO_KEY: Record<string, string> = {
  '🍽️': 'utensils',
  '🍔': 'utensils',
  '🚗': 'car',
  '🛍️': 'shopping-bag',
  '🛒': 'shopping-bag',
  '🎮': 'gamepad-2',
  '🎬': 'gamepad-2',
  '❤️': 'heart-pulse',
  '🏥': 'heart-pulse',
  '🎓': 'graduation-cap',
  '📚': 'graduation-cap',
  '🏠': 'home',
  '⚡': 'zap',
  '💡': 'zap',
  '✈️': 'plane',
  '🎁': 'gift',
  '👕': 'shopping-bag',
  '📁': 'more-horizontal',
  '💼': 'briefcase',
  '💰': 'banknote',
  '💻': 'laptop',
  '📈': 'line-chart',
  '📊': 'line-chart',
  '✨': 'sparkles',
};

export function resolveCategoryIconName(
  icon?: string | null
): keyof typeof Ionicons.glyphMap {
  if (!icon) return 'pricetag-outline';
  if (ICON_MAP[icon]) return ICON_MAP[icon];
  if (EMOJI_TO_KEY[icon] && ICON_MAP[EMOJI_TO_KEY[icon]]) {
    return ICON_MAP[EMOJI_TO_KEY[icon]];
  }
  return 'pricetag-outline';
}

export function CategoryIcon({
  icon,
  color,
  size = 18,
  box = 36,
}: {
  icon?: string | null;
  color?: string | null;
  size?: number;
  box?: number;
}) {
  const colors = useColors();
  const tint = color || colors.brand;
  return (
    <View
      style={[
        styles.box,
        {
          width: box,
          height: box,
          borderRadius: box * 0.32,
          backgroundColor: `${tint}22`,
        },
      ]}
    >
      <Ionicons name={resolveCategoryIconName(icon)} size={size} color={tint} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
