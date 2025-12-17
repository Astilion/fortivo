import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApp } from '@/providers/AppProvider';
import { WorkoutHistoryWithDetails } from '@/types/training';
import colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface DashboardStats {
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  currentStreak: number;
}

export default function HomeScreen() {
  const { workoutService } = useApp();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    workoutsThisWeek: 0,
    workoutsThisMonth: 0,
    currentStreak: 0,
  });
  const [recentWorkouts, setRecentWorkouts] = useState<
    WorkoutHistoryWithDetails[]
  >([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, []),
  );

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // Load stats
      const [week, month, streak] = await Promise.all([
        workoutService.getWorkoutsThisWeek(),
        workoutService.getWorkoutsThisMonth(),
        workoutService.getCurrentStreak(),
      ]);

      setStats({
        workoutsThisWeek: week,
        workoutsThisMonth: month,
        currentStreak: streak,
      });

      // Load recent workouts (limit 5)
      const history = await workoutService.getWorkoutHistory();
      setRecentWorkouts(history.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Dzień dobry';
    if (hour < 18) return 'Dzień dobry';
    return 'Dobry wieczór';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size='large' color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}! 👋</Text>
        <Text style={styles.subtitle}>Twój postęp treningowy</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name='calendar-outline' size={32} color={colors.accent} />
          <Text style={styles.statValue}>{stats.workoutsThisWeek}</Text>
          <Text style={styles.statLabel}>Ten tydzień</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name='bar-chart-outline' size={32} color={colors.accent} />
          <Text style={styles.statValue}>{stats.workoutsThisMonth}</Text>
          <Text style={styles.statLabel}>Ten miesiąc</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name='flame-outline' size={32} color={colors.accent} />
          <Text style={styles.statValue}>{stats.currentStreak}</Text>
          <Text style={styles.statLabel}>Dni z rzędu</Text>
        </View>
      </View>

      {/* Recent Workouts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ostatnie treningi</Text>
          <Pressable onPress={() => router.push('/workout-history')}>
            <Text style={styles.seeAllText}>Zobacz wszystkie →</Text>
          </Pressable>
        </View>

        {recentWorkouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name='fitness-outline'
              size={48}
              color={colors.text.secondary}
            />
            <Text style={styles.emptyText}>Brak treningów</Text>
            <Text style={styles.emptySubtext}>
              Rozpocznij swój pierwszy trening!
            </Text>
          </View>
        ) : (
          recentWorkouts.map((workout) => (
            <Pressable
              key={workout.id}
              style={styles.workoutCard}
              onPress={() =>
                router.push({
                  pathname: '/workout-details',
                  params: { historyId: workout.id },
                })
              }
            >
              <View style={styles.workoutCardContent}>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutName}>{workout.workoutName}</Text>
                  <View style={styles.workoutMeta}>
                    <Ionicons
                      name='calendar-outline'
                      size={14}
                      color={colors.text.secondary}
                    />
                    <Text style={styles.workoutMetaText}>
                      {formatDate(workout.completedAt)}
                    </Text>
                    <Ionicons
                      name='time-outline'
                      size={14}
                      color={colors.text.secondary}
                    />
                    <Text style={styles.workoutMetaText}>
                      {workout.actualDuration} min
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name='chevron-forward'
                  size={20}
                  color={colors.text.secondary}
                />
              </View>
            </Pressable>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Szybkie akcje</Text>

        <Pressable
          style={styles.actionButton}
          onPress={() => router.push('/current-workout')}
        >
          <Ionicons name='play-circle' size={24} color={colors.accent} />
          <Text style={styles.actionButtonText}>Rozpocznij trening</Text>
          <Ionicons
            name='chevron-forward'
            size={20}
            color={colors.text.secondary}
          />
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/workouts')}
        >
          <Ionicons name='list' size={24} color={colors.accent} />
          <Text style={styles.actionButtonText}>Moje plany</Text>
          <Ionicons
            name='chevron-forward'
            size={20}
            color={colors.text.secondary}
          />
        </Pressable>
      </View>
    </ScrollView>
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
    paddingTop: 60,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
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
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.text.primary,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  workoutCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  workoutCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workoutMetaText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginRight: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 12,
  },
});
