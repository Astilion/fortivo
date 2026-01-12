import { StyleSheet, View, Text, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import colors from '@/constants/Colors';
import { WorkoutHistoryCard } from '@/components/ui/WorkoutHistoryCard';
import { ErrorView } from '@/components/ui/ErrorView';
import { LoadingView } from '@/components/ui/LoadingView';
import { useWorkoutHistory } from '@/hooks/useWorkoutHistory';
import { EmptyState } from '@/components/ui/EmptyState';

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
        <EmptyState
          icon='fitness-outline'
          title='Brak ukończonych treningów'
          subtitle='Rozpocznij swój pierwszy trening!'
        />
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
});
