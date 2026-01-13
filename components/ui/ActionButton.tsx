import colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
type IoniconName = keyof typeof Ionicons.glyphMap;

interface ActionButtonProps {
  icon: IoniconName;
  title: string;
  onPress: () => void;
  showChevron?: boolean;
}

export const ActionButton = ({
  icon,
  title,
  onPress,
  showChevron = true,
}: ActionButtonProps) => {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Ionicons name={icon} size={24} color={colors.accent} />
      <Text style={styles.title}>{title}</Text>
      {showChevron && (
        <Ionicons
          name='chevron-forward'
          size={20}
          color={colors.text.secondary}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 12,
  },
});
