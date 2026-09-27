import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '@/providers/AppProvider';
import { DatabaseMigrationError, initDatabase } from '@/database/database';
import { useDbErrorStore } from '@/store/dbErrorStore';

jest.mock('@/database/database', () => {
  class DatabaseMigrationError extends Error {
    readonly version: number;
    readonly cause?: unknown;

    constructor(version: number, cause?: unknown) {
      super(`Migracja v${version} nie powiodła się`);
      this.name = 'DatabaseMigrationError';
      this.version = version;
      this.cause = cause;
    }
  }
  return {
    DB_NAME: 'fortivo.db',
    DatabaseMigrationError,
    initDatabase: jest.fn(),
    generateId: jest.fn(),
  };
});

jest.mock('@/utils/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), db: jest.fn() },
}));

const mockInitDatabase = initDatabase as jest.MockedFunction<
  typeof initDatabase
>;

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const renderApp = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <AppProvider>
        <Text>app</Text>
      </AppProvider>
    </SafeAreaProvider>,
  );

describe('AppProvider recovery', () => {
  beforeEach(() => {
    mockInitDatabase.mockReset();
    useDbErrorStore.setState({ dbError: null, reinitNonce: 0 });
  });

  test('a non-migration failure on recovery retry shows a retryable error', async () => {
    mockInitDatabase
      .mockRejectedValueOnce(
        new DatabaseMigrationError(9, new Error('disk I/O error')),
      )
      .mockRejectedValueOnce(new Error('seed failed'));

    renderApp();
    fireEvent.press(await screen.findByText('Spróbuj ponownie'));

    expect(
      await screen.findByText('Nie udało się uruchomić aplikacji'),
    ).toBeTruthy();
    expect(useDbErrorStore.getState().dbError).toBeNull();
  });
});
