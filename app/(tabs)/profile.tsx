import { useProfileSettings } from '@/hooks/useProfileSettings';
import colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/providers/AppProvider';
import { useState, useEffect } from 'react';

type WeightUnit = 'kg' | 'lbs';

interface SectionHeaderProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title }) => (
  <View style={styles.sectionHeader}>
    <Ionicons name={icon} size={16} color={colors.text.secondary} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

interface SettingsRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  isLast?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  description,
  children,
  isLast = false,
}) => (
  <View style={[styles.row, !isLast && styles.rowBorder]}>
    <View style={styles.rowLabel}>
      <Text style={styles.rowLabelText}>{label}</Text>
      {description && <Text style={styles.rowDescription}>{description}</Text>}
    </View>
    <View style={styles.rowControl}>{children}</View>
  </View>
);

export default function ProfileScreen() {
  const { profileService } = useApp();
  const { settings, setSettings, loading, error, updateSettings } =
    useProfileSettings();
  const [restTimeInput, setRestTimeInput] = useState<string>('');
  useEffect(() => {
    if (settings) {
      setRestTimeInput(settings.defaultRestTime.toString());
    }
  }, [settings?.defaultRestTime]);

  const handleWeightUnitChange = (unit: WeightUnit) => {
    const updatedSettings = { ...settings!, preferredWeightUnit: unit };
    setSettings(updatedSettings);
    profileService.updateUserSettings(updatedSettings);
  };

  const handleRestTimeChange = (value: string) => {
    setRestTimeInput(value);
  };

  const handleRestTimeBlur = async () => {
    const numericValue = parseInt(restTimeInput, 10);
    const finalValue =
      isNaN(numericValue) || numericValue <= 0 ? 90 : numericValue;

    setRestTimeInput(finalValue.toString());
    const updatedSettings = { ...settings!, defaultRestTime: finalValue };
    setSettings(updatedSettings);

    try {
      await profileService.updateUserSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating rest time:', error);
    }
  };

  const handleToggle =
    (field: 'trackRPE' | 'trackTempo' | 'trackRestTime') =>
    (value: boolean) => {
      const updatedSettings = { ...settings!, [field]: value };
      setSettings(updatedSettings);
      profileService.updateUserSettings(updatedSettings);
    };

  // ── Loading & Error states ─────────────────────────────────────────────────

  if (loading && !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size='large' color={colors.accent} />
          <Text style={styles.loadingText}>Ładowanie ustawień...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons
            name='alert-circle-outline'
            size={48}
            color={colors.danger}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        {loading && (
          <ActivityIndicator
            size='small'
            color={colors.accent}
            style={styles.headerSpinner}
          />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Sekcja: Jednostki ── */}
        <SectionHeader icon='scale-outline' title='JEDNOSTKI' />
        <View style={styles.card}>
          <SettingsRow label='Jednostka wagi' isLast>
            <View style={styles.segmentedControl}>
              {(['kg', 'lbs'] as WeightUnit[]).map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.segmentButton,
                    settings?.preferredWeightUnit === unit &&
                      styles.segmentButtonActive,
                  ]}
                  onPress={() => handleWeightUnitChange(unit)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      settings?.preferredWeightUnit === unit &&
                        styles.segmentTextActive,
                    ]}
                  >
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SettingsRow>
        </View>

        {/* ── Sekcja: Trening ── */}
        <SectionHeader icon='timer-outline' title='TRENING' />
        <View style={styles.card}>
          <SettingsRow
            label='Domyślny czas odpoczynku'
            description='Czas między seriami (sekundy)'
          >
            <View style={styles.numberInputWrapper}>
              <TextInput
                style={styles.numberInput}
                value={restTimeInput}
                onChangeText={handleRestTimeChange}
                onBlur={handleRestTimeBlur}
                keyboardType='number-pad'
                maxLength={4}
                placeholderTextColor={colors.muted}
              />
              <Text style={styles.numberInputUnit}>s</Text>
            </View>
          </SettingsRow>

          <SettingsRow
            label='Tracking RPE'
            description='Ocena subiektywnego wysiłku (1-10)'
          >
            <Switch
              value={settings?.trackRPE ?? false}
              onValueChange={handleToggle('trackRPE')}
              trackColor={{ false: colors.secondary, true: colors.background }}
              thumbColor={settings?.trackRPE ? colors.accent : colors.muted}
              ios_backgroundColor={colors.secondary}
            />
          </SettingsRow>

          <SettingsRow
            label='Tracking Tempo'
            description='Tempo wykonania ćwiczenia (np. 3-1-2)'
          >
            <Switch
              value={settings?.trackTempo ?? false}
              onValueChange={handleToggle('trackTempo')}
              trackColor={{ false: colors.secondary, true: colors.background }}
              thumbColor={settings?.trackTempo ? colors.accent : colors.muted}
              ios_backgroundColor={colors.secondary}
            />
          </SettingsRow>

          <SettingsRow
            label='Tracking odpoczynku'
            description='Mierz czas przerw między seriami'
            isLast
          >
            <Switch
              value={settings?.trackRestTime ?? false}
              onValueChange={handleToggle('trackRestTime')}
              trackColor={{ false: colors.secondary, true: colors.background }}
              thumbColor={
                settings?.trackRestTime ? colors.accent : colors.muted
              }
              ios_backgroundColor={colors.secondary}
            />
          </SettingsRow>
        </View>

        {/* ── Sekcja: Aplikacja ── */}
        <SectionHeader icon='information-circle-outline' title='APLIKACJA' />
        <View style={styles.card}>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabelText}>Wersja</Text>
            <Text style={styles.metaText}>0.1.0-beta</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabelText}>Autor</Text>
            <Text style={styles.metaText}>Astilion</Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 15,
  },
  errorText: {
    color: colors.danger,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
    flex: 1,
  },
  headerSpinner: {
    marginLeft: 8,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  bottomPadding: {
    height: 40,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    letterSpacing: 0.8,
  },

  // Card
  card: {
    backgroundColor: colors.secondary,
    borderRadius: 14,
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.background,
  },
  rowLabel: {
    flex: 1,
    marginRight: 12,
  },
  rowLabelText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '400',
  },
  rowDescription: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  rowControl: {
    alignItems: 'flex-end',
  },

  // Segmented control (kg / lbs)
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 2,
  },
  segmentButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: colors.accent,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  segmentTextActive: {
    color: colors.primary, // ciemny tekst na żółtym tle
    fontWeight: '700',
  },

  // Number input
  numberInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  numberInput: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    minWidth: 40,
    textAlign: 'right',
  },
  numberInputUnit: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },

  // Meta text
  metaText: {
    fontSize: 15,
    color: colors.text.secondary,
  },
});
