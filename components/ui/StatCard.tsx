import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import colors from '@/constants/Colors';

type IoniconName = keyof typeof Ionicons.glyphMap;
interface StatCardProps {
  icon: IoniconName;
  value: number | string;
  label: string;
}

export const StatCard = ({ icon, value, label }: StatCardProps) => {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={32} color={colors.accent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
