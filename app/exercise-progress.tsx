import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingView } from '@/components/ui/LoadingView';
import colors from '@/constants/Colors';
import { useApp } from '@/providers/AppProvider';
import { useProfileSettings } from '@/hooks/useProfileSettings';
import { ExerciseProgressWithWorkout } from '@/types/training';
import { formatDate } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { logger } from '@/utils/logger';

export default function ExerciseProgressScreen() {
  const { exerciseId } = useLocalSearchParams<{
    exerciseId: string;
    exerciseName?: string;
  }>();
  const { workoutService } = useApp();
  const { settings } = useProfileSettings();
  const weightUnit = settings?.preferredWeightUnit ?? 'kg';
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
        logger.error('Error loading exercise progress:', error);
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
    return <LoadingView />;
  }

  return (
    <View style={styles.container}>
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {bestPR}
            {weightUnit}
          </Text>
          <Text style={styles.statLabel}>Best PR</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalSessions}</Text>
          <Text style={styles.statLabel}>Sesje</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {formatNumber(totalVolume)}
            {weightUnit}
          </Text>
          <Text style={styles.statLabel}>Total Volume</Text>
        </View>
      </View>

      {/* History List */}
      {progress.length === 0 ? (
        <EmptyState
          icon="barbell-outline"
          title="Brak historii"
          subtitle="Wykonaj to ćwiczenie w treningu!"
        />
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
                    <Ionicons name="trophy" size={18} color={colors.primary} />
                    <Text style={styles.prText}>REKORD!</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardContent}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Max ciężar</Text>
                  <Text style={styles.statValue}>
                    {item.maxWeight}
                    {weightUnit}
                  </Text>
                </View>

                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Volume</Text>
                  <Text style={styles.statValue}>
                    {item.totalVolume}
                    {weightUnit}
                  </Text>
                </View>
              </View>

              {item.workoutName && (
                <View style={styles.workoutInfo}>
                  <Ionicons
                    name="fitness-outline"
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
  cardPR: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.accent,
  },
});
