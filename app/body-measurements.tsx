import colors from '@/constants/Colors';
import { useApp } from '@/providers/AppProvider';
import { BodyMeasurement } from '@/types/training';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BODY_PARTS } from '@/constants/bodyParts';
import { MeasurementRow } from '@/components/measurements/MeasurementRow';
import { HistoryRow } from '@/components/measurements/HistoryRow';

type TabType = 'measurements' | 'history';

export default function BodyMeasurementsScreen() {
  const { measurementService } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('measurements');
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [inputs, setInputs] = useState<Record<string, string>>(
    Object.fromEntries(BODY_PARTS.map((p) => [p.key, ''])),
  );
  const [error, setError] = useState<string | null>(null);

  const loadMeasurements = useCallback(async () => {
    if (!measurementService) return;
    const fetchedMeasurements =
      await measurementService.getMeasurements('local_user');
    setMeasurements(fetchedMeasurements);
  }, [measurementService]);

  useFocusEffect(
    useCallback(() => {
      loadMeasurements();
    }, [loadMeasurements]),
  );
  const handleAdd = async (bodyPartKey: string) => {
    if (!measurementService) return;
    const value = parseFloat(inputs[bodyPartKey].replace(',', '.'));
    if (isNaN(value) || value < 10 || value > 300) {
      setError('Wprowadź prawidłową wartość (10-300 cm)');
      return;
    }
    setError(null);
    const newEntry = await measurementService.addMeasurement(
      'local_user',
      bodyPartKey,
      value,
      new Date().toISOString().split('T')[0],
    );
    setMeasurements((prev) => [newEntry, ...prev]);
    setInputs((prev) => ({ ...prev, [bodyPartKey]: '' }));
  };

  const handleDelete = async (id: string) => {
    if (!measurementService) return;
    await measurementService.deleteMeasurement(id);
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  };

  const getLastEntry = (bodyPartKey: string) =>
    measurements.find((m) => m.bodyPart === bodyPartKey);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Tab switcher ── */}
        <View style={styles.tabBar}>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'measurements' && styles.tabActive,
            ]}
            onPress={() => setActiveTab('measurements')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'measurements' && styles.tabTextActive,
              ]}
            >
              Pomiary
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'history' && styles.tabTextActive,
              ]}
            >
              Historia
            </Text>
          </Pressable>
        </View>

        {/* ── Measurements ── */}
        {activeTab === 'measurements' && (
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
          >
            {error && <Text style={styles.errorText}>{error}</Text>}
            {BODY_PARTS.map((part) => (
              <MeasurementRow
                key={part.key}
                label={part.label}
                lastEntry={getLastEntry(part.key)}
                inputValue={inputs[part.key]}
                onChangeText={(value) =>
                  setInputs((prev) => ({ ...prev, [part.key]: value }))
                }
                onAdd={() => handleAdd(part.key)}
              />
            ))}
          </ScrollView>
        )}

        {/* ── History ── */}
        {activeTab === 'history' && (
          <>
            {measurements.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name='body-outline' size={48} color={colors.muted} />
                <Text style={styles.emptyText}>Brak pomiarów</Text>
                <Text style={styles.emptySubtext}>
                  Dodaj pierwszy pomiar w zakładce Pomiary
                </Text>
              </View>
            ) : (
              <FlatList
                data={measurements}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <HistoryRow
                    entry={item}
                    onDelete={(id) => {
                      handleDelete(id);
                    }}
                  />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
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
  flex: {
    flex: 1,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.primary,
  },

  // List
  listContent: {
    padding: 16,
    gap: 8,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Error
  errorText: {
    fontSize: 12,
    color: colors.danger,
    paddingHorizontal: 20,
    marginTop: 4,
  },
});
