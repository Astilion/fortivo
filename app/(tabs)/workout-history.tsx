import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApp } from '@/providers/AppProvider';
import { WorkoutHistoryWithDetails } from '@/types/training';
import colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutHistoryCard } from '@/components/ui/WorkoutHistoryCard';

export default function WorkoutHistoryScreen() {
  const { workoutService } = useApp();
  const router = useRouter();
  const [history, setHistory] = useState<WorkoutHistoryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, []),
  );

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await workoutService.getWorkoutHistory();
      setHistory(data);
    } catch (error) {
      console.error('Error loading workout history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkoutPress = (historyId: string) => {
    router.push({
      pathname: '/workout-details',
      params: { historyId },
    });
    console.log('Workout pressed:', historyId);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size='large' color={colors.accent} />
      </View>
    );
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
