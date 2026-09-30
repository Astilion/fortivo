import colors from '@/constants/Colors';
import { SUPPORT_EMAIL } from '@/constants/Links';
import { DatabaseMigrationError, DB_NAME } from '@/database/database';
import { useDbErrorStore } from '@/store/dbErrorStore';
import { confirmAction } from '@/utils/confirm';
import { logger } from '@/utils/logger';
import * as SQLite from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RESET_WARNING =
  'Tej operacji nie da się cofnąć. Wszystkie treningi, plany, historia i pomiary zostaną trwale usunięte. Zanim to zrobisz, napisz do nas — poprawka może uratować Twoje dane.';

const errorCode = (error: DatabaseMigrationError) =>
  error.cause instanceof Error
    ? `Kod: v${error.version} · ${error.cause.message}`
    : `Kod: v${error.version}`;

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
        'Błąd nadal występuje. Twoje dane są w telefonie — wyślij zrzut ekranu z kodem.',
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
      'Zresetować bazę?',
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
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Wystąpił problem z bazą danych</Text>
        <Text style={styles.body}>
          Aktualizacja danych aplikacji nie powiodła się. Twoje treningi i
          pomiary są nadal zapisane w telefonie.
        </Text>
        <Text style={styles.body}>
          Zrób zrzut tego ekranu i wyślij go na adres:
        </Text>
        <Text selectable style={styles.email}>
          {SUPPORT_EMAIL}
        </Text>
        <Text style={styles.body}>
          Poprawka przyjdzie w aktualizacji aplikacji.
        </Text>
        {dbError ? (
          <Text selectable style={styles.code}>
            {errorCode(dbError)}
          </Text>
        ) : null}
      </ScrollView>

      {busy ? (
        <View style={styles.busy}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <View style={styles.footer}>
          <Pressable
            style={[styles.button, styles.retryButton]}
            onPress={handleRetry}
          >
            <Text style={styles.retryText}>Spróbuj ponownie</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={handleReset} hitSlop={8}>
            <Text style={styles.resetText}>Zresetuj bazę</Text>
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
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 24,
  },
  title: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  body: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  email: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  code: {
    color: colors.text.primary,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
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
  retryButton: {
    backgroundColor: colors.accent,
  },
  retryText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  resetText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '600',
  },
});
