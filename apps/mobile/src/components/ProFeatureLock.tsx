import { View, Text, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScalePress } from './motion';
import { useColors } from '../themeContext';
import { WEB_UPGRADE_URL } from '../lib/webUrl';
import { radii } from '../theme';

export function ProFeatureLock({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  const colors = useColors();
  const styles = StyleSheet.create({
    wrap: {
      flex: 1,
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.bg,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      alignItems: 'center',
    },
    icon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
    },
    message: {
      marginTop: 8,
      fontSize: 13,
      lineHeight: 19,
      color: colors.muted,
      textAlign: 'center',
    },
    btn: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.brand,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    btnText: {
      color: colors.onBrand,
      fontWeight: '800',
      fontSize: 14,
    },
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.icon}>
          <Ionicons name="diamond-outline" size={22} color={colors.brand} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <ScalePress style={styles.btn} onPress={() => void Linking.openURL(WEB_UPGRADE_URL)}>
          <Ionicons name="open-outline" size={16} color={colors.onBrand} />
          <Text style={styles.btnText}>Lihat Pro Lifetime</Text>
        </ScalePress>
      </View>
    </View>
  );
}
