import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useApp } from '@/providers/AppProvider';
import { WorkoutHistoryDetails } from '@/types/training';
import colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '@/utils/date';

export default function WorkoutDetailsScreen() {
  const { historyId } = useLocalSearchParams<{ historyId: string }>();
  const { workoutService } = useApp();
  const router = useRouter();
  const [details, setDetails] = useState<WorkoutHistoryDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!historyId) {
      alert('Brak ID treningu');
      router.back();
      return;
    }
    loadDetails();
  }, [historyId]);

  const loadDetails = async () => {
    if (!historyId) return;

    try {
      setLoading(true);
      const data = await workoutService.getWorkoutHistoryDetails(historyId);
      setDetails(data);
    } catch (error) {
      console.error('Error loading workout details:', error);
      alert('Nie udało się załadować szczegółów treningu');
      router.back();
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size='large' color={colors.accent} />
      </View>
    );
  }

  if (!details) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Nie znaleziono treningu</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{details.workoutName}</Text>
        <View style={styles.headerInfo}>
          <View style={styles.headerInfoItem}>
            <Ionicons
              name='calendar-outline'
              size={16}
              color={colors.text.secondary}
            />
            <Text style={styles.headerInfoText}>
              {formatDate(details.completedAt)}
            </Text>
          </View>
          <View style={styles.headerInfoItem}>
            <Ionicons
              name='time-outline'
              size={16}
              color={colors.text.secondary}
            />
            <Text style={styles.headerInfoText}>
              {details.actualDuration} min
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{details.stats.totalVolume}</Text>
          <Text style={styles.statLabel}>Volume (kg)</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {details.stats.completedSets}/{details.stats.totalSets}
          </Text>
          <Text style={styles.statLabel}>Serie</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{details.exercises.length}</Text>
          <Text style={styles.statLabel}>Ćwiczenia</Text>
        </View>
      </View>

      {/* Exercises List */}
      <ScrollView style={styles.content}>
        {details.exercises.map((item, exIndex) => (
          <View key={item.exercise.id} style={styles.exerciseBlock}>
            {/* Exercise name */}
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/exercise-progress',
                  params: { exerciseId: item.exercise.id },
                })
              }
            >
              <Text style={styles.exerciseName}>
                {exIndex + 1}. {item.exercise.name}
              </Text>
            </Pressable>

            {/* Sets */}
            {item.sets.map((set, setIndex) => (
              <View key={set.id} style={styles.setCard}>
                <View style={styles.setHeader}>
                  <Text style={styles.setNumber}>Seria {setIndex + 1}</Text>

                  {/* Completed indicator */}
                  {set.completed && (
                    <Ionicons
                      name='checkmark-circle'
                      size={20}
                      color={colors.accent}
                    />
                  )}
                </View>

                {/* Set data */}
                <View style={styles.setData}>
                  <View style={styles.dataItem}>
                    <Text style={styles.dataLabel}>Ciężar</Text>
                    <Text style={styles.dataValue}>
                      {set.actualWeight || set.weight || 0} kg
                    </Text>
                  </View>

                  <View style={styles.dataItem}>
                    <Text style={styles.dataLabel}>Powtórzenia</Text>
                    <Text style={styles.dataValue}>
                      {set.actualReps || set.reps || 0}
                    </Text>
                  </View>

                  {/* Show planned vs actual if different */}
                  {(set.actualWeight !== set.weight ||
                    set.actualReps !== set.reps) && (
                    <View style={styles.plannedData}>
                      <Text style={styles.plannedLabel}>
                        Planowane: {set.weight}kg × {set.reps}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
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
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  headerInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  headerInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerInfoText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  exerciseBlock: {
    marginBottom: 24,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  setCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  setData: {
    gap: 8,
  },
  dataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  plannedData: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  plannedLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});
