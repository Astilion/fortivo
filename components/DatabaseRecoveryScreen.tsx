import colors from '@/constants/Colors';
import { DB_NAME } from '@/database/database';
import { useDbErrorStore } from '@/store/dbErrorStore';
import { confirmAction } from '@/utils/confirm';
import { logger } from '@/utils/logger';
import * as SQLite from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RESET_WARNING =
  'Aktualizacja danych aplikacji nie powiodła się. Możesz zresetować bazę danych. Spowoduje to utratę wszystkich zapisanych treningów, planów i pomiarów.';

// Full-screen takeover rendered directly by AppProvider when a migration
// fails. It is intentionally NOT a router route: there is no services
// context during a DB error, so mounting the normal screen tree would
// crash on useApp(). This component must not depend on the router context.
export const DatabaseRecoveryScreen = () => {
  const insets = useSafeAreaInsets();
  const dbError = useDbErrorStore((state) => state.dbError);
  const requestReinit = useDbErrorStore((state) => state.requestReinit);
  const [busy, setBusy] = useState(false);
  // Distinguishes a fresh failure from the error already present on mount.
  const attemptingRef = useRef(false);

  // A new error while attempting means the retry/reset failed (success
  // clears dbError and unmounts this screen instead).
  useEffect(() => {
    if (attemptingRef.current && dbError) {
      attemptingRef.current = false;
      setBusy(false);
      Alert.alert(
        'Nie udało się naprawić bazy',
        'Spróbuj zresetować bazę danych.',
      );
    }
  }, [dbError]);

  // Block hardware back so the user cannot escape the gate into a broken app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const handleRetry = useCallback(() => {
    setBusy(true);
    attemptingRef.current = true;
    requestReinit();
  }, [requestReinit]);

  const handleReset = useCallback(() => {
    confirmAction(
      'Zresetuj bazę',
      RESET_WARNING,
      async () => {
        setBusy(true);
        attemptingRef.current = true;
        try {
          await SQLite.deleteDatabaseAsync(DB_NAME);
        } catch (error) {
          logger.error('Nie udało się usunąć bazy danych', error);
          attemptingRef.current = false;
          setBusy(false);
          Alert.alert(
            'Nie udało się zresetować bazy',
            'Spróbuj ponownie za chwilę.',
          );
          return;
        }
        requestReinit();
      },
      'Zresetuj',
    );
  }, [requestReinit]);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Wystąpił problem z bazą danych</Text>
        <Text style={styles.body}>{RESET_WARNING}</Text>
      </View>

      {busy ? (
        <View style={styles.busy}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <View style={styles.footer}>
          <Pressable
            style={[styles.button, styles.resetButton]}
            onPress={handleReset}
          >
            <Text style={styles.resetText}>Zresetuj bazę</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.retryButton]}
            onPress={handleRetry}
          >
            <Text style={styles.retryText}>Spróbuj ponownie</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  busy: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footer: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  resetText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: colors.background,
  },
  retryText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
