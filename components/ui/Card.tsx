import colors from '@/constants/Colors';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
}

export const Card = ({ children, onPress, onLongPress, style }: CardProps) => {
  const Container = onPress ? Pressable : View;

  return (
    <Container
      style={[styles.container, style]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.secondary,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,

    elevation: 5,
  },
});
