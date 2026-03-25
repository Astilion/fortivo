import colors from '@/constants/Colors';
import { WeightEntry } from '@/types/training';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileSettings } from '@/hooks/useProfileSettings';
import { useApp } from '@/providers/AppProvider';
import { AddEntryForm } from '@/components/weight/AddEntryForm';
import { WeightEntryRow } from '@/components/weight/WeightEntryRow';
import { SummaryCard } from '@/components/weight/SummaryCard';
import { LOCAL_USER_ID } from '@/constants/User';

export default function WeightTrackingScreen() {
  const router = useRouter();
  const { settings } = useProfileSettings();
  const { weightService } = useApp();

  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const weightUnit = settings?.preferredWeightUnit || 'kg';
  const goalWeight = settings?.goalWeight || undefined;
  const currentWeight = entries[0]?.weight;

  const loadEntries = useCallback(async () => {
    if (!weightService) return;
    const fetchedEntries = await weightService.getWeightEntries(LOCAL_USER_ID);
    setEntries(fetchedEntries);
  }, [weightService]);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries]),
  );
  const handleAddEntry = async (weight: number, notes?: string) => {
    if (!weightService) return;
    const newEntry = await weightService.addWeightEntry(
      LOCAL_USER_ID,
      weight,
      new Date().toISOString().split('T')[0],
      notes,
    );
    setEntries((prev) => [newEntry, ...prev]);
  };
  const handleDeleteEntry = async (id: string) => {
    if (!weightService) return;
    await weightService.deleteWeightEntry(id);
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Summary ── */}
        <SummaryCard
          currentWeight={currentWeight}
          goalWeight={goalWeight}
          weightUnit={weightUnit}
        />

        {/* ── Add Entry Form ── */}
        <AddEntryForm
          weightUnit={weightUnit}
          onAdd={(weight, notes) => handleAddEntry(weight, notes)}
        />

        {/* ── Historia ── */}
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Historia</Text>
          <Text style={styles.historyCount}>{entries.length} wpisów</Text>
        </View>

        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name='scale-outline' size={48} color={colors.muted} />
            <Text style={styles.emptyText}>Brak wpisów</Text>
            <Text style={styles.emptySubtext}>
              Dodaj pierwszy pomiar powyżej
            </Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <WeightEntryRow
                entry={item}
                weightUnit={weightUnit}
                onDelete={(id) => {
                  handleDeleteEntry(id);
                }}
                isLatest={index === 0}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  keyboardView: {
    flex: 1,
  },

  // History
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  historyCount: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.muted,
  },
});
