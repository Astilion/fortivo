import colors from '@/constants/Colors';
import { View, StyleSheet, Pressable } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
}

export const Card = ({ children, onPress }: CardProps) => {
  const Container = onPress ? Pressable : View;

  return (
    <Container style={styles.container} onPress={onPress}>
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
