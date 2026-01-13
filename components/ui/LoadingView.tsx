import colors from '@/constants/Colors';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
interface LoadingViewProps {
  message?: string;
}
export function LoadingView({ message }: LoadingViewProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size='large' color={colors.accent} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  message: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 16,
    textAlign: 'center',
  },
});
