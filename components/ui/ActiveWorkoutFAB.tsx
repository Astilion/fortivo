import colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ActiveWorkoutFABProps {
  workoutStartTime: number;
}

const formatElapsed = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const ActiveWorkoutFAB = ({
  workoutStartTime,
}: ActiveWorkoutFABProps) => {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(Date.now() - workoutStartTime);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - workoutStartTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [workoutStartTime]);

  return (
    <Pressable
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      onPress={() => router.push('/active-workout')}
    >
      <Ionicons name='barbell-outline' size={22} color={colors.primary} />
      <View style={styles.timerBadge}>
        <Text style={styles.timerText}>{formatElapsed(elapsed)}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  timerBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: colors.secondary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  timerText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
  },
});
