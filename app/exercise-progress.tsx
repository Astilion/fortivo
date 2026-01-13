import colors from '@/constants/Colors';
import { useApp } from '@/providers/AppProvider';
import { ExerciseProgressWithWorkout } from '@/types/training';
import { formatDate } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ExerciseProgressScreen() {
  const { exerciseId, exerciseName } = useLocalSearchParams<{
    exerciseId: string;
    exerciseName?: string;
  }>();
  const { workoutService } = useApp();
  const router = useRouter();

  const [progress, setProgress] = useState<ExerciseProgressWithWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!exerciseId) {
      Alert.alert('Błąd', 'Brak ID ćwiczenia');
      router.back();
      return;
    }

    const loadProgress = async () => {
      if (!exerciseId) return;

      try {
        setLoading(true);
        const data = await workoutService.getExerciseProgress(exerciseId!);
        setProgress(data);
      } catch (error) {
        console.error('Error loading exercise progress:', error);
        Alert.alert('Błąd', 'Nie udało się załadować historii ćwiczenia');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    loadProgress();
  }, [exerciseId, workoutService, router]);

  const bestPR =
    progress.length > 0 ? Math.max(...progress.map((p) => p.maxWeight)) : 0;
  const totalSessions = progress.length;
  const totalVolume = Math.round(
    progress.reduce((sum, p) => sum + p.totalVolume, 0),
  );

  const formatNumber = (num: number) => {
    return num.toLocaleString('pl-PL');
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{exerciseName || 'Historia ćwiczenia'}</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{bestPR}kg</Text>
          <Text style={styles.statLabel}>Best PR</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalSessions}</Text>
          <Text style={styles.statLabel}>Sesje</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatNumber(totalVolume)}kg</Text>
          <Text style={styles.statLabel}>Total Volume</Text>
        </View>
      </View>

      {/* History List */}
      {progress.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name='barbell-outline'
            size={64}
            color={colors.text.secondary}
          />
          <Text style={styles.emptyText}>Brak historii</Text>
          <Text style={styles.emptySubtext}>
            Wykonaj to ćwiczenie w treningu!
          </Text>
        </View>
      ) : (
        <FlatList
          data={progress}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          renderItem={({ item }) => (
            <View style={[styles.card, item.personalRecord && styles.cardPR]}>
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
                {item.personalRecord && (
                  <View style={styles.prBadge}>
                    <Ionicons name='trophy' size={18} color={colors.primary} />{' '}
                    {/* Większa ikona */}
                    <Text style={styles.prText}>REKORD!</Text>{' '}
                    {/* Zmiana tekstu */}
                  </View>
                )}
              </View>

              <View style={styles.cardContent}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Max ciężar</Text>
                  <Text style={styles.statValue}>{item.maxWeight}kg</Text>
                </View>

                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Volume</Text>
                  <Text style={styles.statValue}>{item.totalVolume}kg</Text>
                </View>
              </View>

              {item.workoutName && (
                <View style={styles.workoutInfo}>
                  <Ionicons
                    name='fitness-outline'
                    size={14}
                    color={colors.text.secondary}
                  />
                  <Text style={styles.workoutName}>{item.workoutName}</Text>
                </View>
              )}
            </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  prText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  stat: {
    flex: 1,
  },
  workoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  workoutName: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
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
  cardPR: {
    backgroundColor: colors.background, // Ciemniejsze tło
    borderWidth: 2,
    borderColor: colors.accent, // Żółta ramka
  },
});
