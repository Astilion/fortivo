import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import colors from '@/constants/Colors';
import { useRecentWorkouts } from '@/hooks/useRecentWorkouts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { LoadingView } from '@/components/ui/LoadingView';
import { ErrorView } from '@/components/ui/ErrorView';
import { WorkoutHistoryCard } from '@/components/ui/WorkoutHistoryCard';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { getGreeting } from '@/utils/date';
import { ActionButton } from '@/components/ui/ActionButton';

export default function HomeScreen() {
  const router = useRouter();

  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats,
  } = useDashboardStats();

  const {
    workouts,
    loading: workoutsLoading,
    error: workoutsError,
    refresh: refreshWorkouts,
  } = useRecentWorkouts(5);

  const loading = statsLoading || workoutsLoading;
  const error = statsError || workoutsError;

  const handleRetry = useCallback(() => {
    refreshStats();
    refreshWorkouts();
  }, [refreshStats, refreshWorkouts]);

  if (loading) {
    return <LoadingView />;
  }
  if (error) {
    return <ErrorView error={error} onRetry={handleRetry} />;
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
        <StatCard
          icon='calendar-outline'
          value={stats.workoutsThisWeek}
          label='Ten tydzień'
        />
        <StatCard
          icon='bar-chart-outline'
          value={stats.workoutsThisMonth}
          label='Ten miesiąc'
        />
        <StatCard
          icon='flame-outline'
          value={stats.currentStreak}
          label='Dni z rzędu'
        />
      </View>

      {/* Recent Workouts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ostatnie treningi</Text>
          <Pressable onPress={() => router.push('/workout-history')}>
            <Text style={styles.seeAllText}>Zobacz wszystkie →</Text>
          </Pressable>
        </View>

        {workouts.length === 0 ? (
          <EmptyState
            icon='fitness-outline'
            title='Brak treningów'
            subtitle='Rozpocznij swój pierwszy trening!'
          />
        ) : (
          workouts.map((workout) => (
            <WorkoutHistoryCard
              key={workout.id}
              workoutName={workout.workoutName}
              completedAt={workout.completedAt}
              duration={workout.actualDuration}
              showTime={false}
              onPress={() =>
                router.push({
                  pathname: '/workout-details',
                  params: { historyId: workout.id },
                })
              }
            />
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Szybkie akcje</Text>

        <ActionButton
          icon='play-circle'
          title='Rozpocznij trening'
          onPress={() => router.push('/current-workout')}
        />

        <ActionButton
          icon='list'
          title='Moje plany'
          onPress={() => router.push('/(tabs)/workouts')}
        />
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
