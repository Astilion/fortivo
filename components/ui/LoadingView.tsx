import colors from '@/constants/Colors';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface LoadingViewProps {
  message?: string;
  inline?: boolean;
}

export function LoadingView({ message, inline }: LoadingViewProps) {
  return (
    <View style={[styles.container, inline && styles.containerInline]}>
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
  containerInline: {
    flex: 0,
    backgroundColor: undefined,
    paddingVertical: 24,
  },
  message: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 16,
    textAlign: 'center',
  },
});
