import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/Colors';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}
export const Input = ({
  value,
  onChangeText,
  placeholder,
  icon,
}: InputProps) => {
  return (
    <View style={styles.container}>
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color={colors.text.secondary}
          style={styles.icon}
        />
      )}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.text.secondary}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  icon: {},
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 16,
    padding: 4,
  },
});
