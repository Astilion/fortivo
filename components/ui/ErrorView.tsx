import colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';

interface ErrorViewProps {
  error: string;
  onRetry?: () => void;
  inline?: boolean;
}

export function ErrorView({ error, onRetry, inline }: ErrorViewProps) {
  return (
    <View style={[styles.container, inline && styles.containerInline]}>
      <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
      <Text style={styles.title}>Wystąpił błąd</Text>
      <Text style={styles.errorText}>{error}</Text>
      {onRetry && (
        <Button title="Spróbuj ponownie" onPress={onRetry} variant="primary" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    gap: 12,
  },
  containerInline: {
    flex: 0,
    backgroundColor: undefined,
    paddingVertical: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
});
