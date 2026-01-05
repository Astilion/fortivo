import { StyleSheet, View, Text, FlatList } from 'react-native';
import { useRouter } from 'expo-router';

import colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutHistoryCard } from '@/components/ui/WorkoutHistoryCard';
import { ErrorView } from '@/components/ui/ErrorView';
import { LoadingView } from '@/components/ui/LoadingView';
import { useWorkoutHistory } from '@/hooks/useWorkoutHistory';

export default function WorkoutHistoryScreen() {
  const router = useRouter();

  const { history, loading, error, refresh } = useWorkoutHistory();

  const handleWorkoutPress = (historyId: string) => {
    router.push({
      pathname: '/workout-details',
      params: { historyId },
    });
    console.log('Workout pressed:', historyId);
  };
  const handleRetry = refresh;

  if (loading) {
    return <LoadingView />;
  }
  if (error) {
    return <ErrorView error={error} onRetry={handleRetry} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historia Treningów</Text>
        <Text style={styles.subtitle}>
          {history.length} {history.length === 1 ? 'trening' : 'treningów'}
        </Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name='fitness-outline'
            size={64}
            color={colors.text.secondary}
          />
          <Text style={styles.emptyText}>Brak ukończonych treningów</Text>
          <Text style={styles.emptySubtext}>
            Rozpocznij swój pierwszy trening!
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          renderItem={({ item }) => (
            <WorkoutHistoryCard
              workoutName={item.workoutName}
              completedAt={item.completedAt}
              duration={item.actualDuration}
              onPress={() => handleWorkoutPress(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
