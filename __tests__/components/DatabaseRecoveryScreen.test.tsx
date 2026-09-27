import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseRecoveryScreen } from '@/components/DatabaseRecoveryScreen';
import { SUPPORT_EMAIL } from '@/constants/Links';
import { DatabaseMigrationError } from '@/database/database';
import { useDbErrorStore } from '@/store/dbErrorStore';

jest.mock('@/utils/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), db: jest.fn() },
}));

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const renderWithError = (error: DatabaseMigrationError) => {
  useDbErrorStore.setState({ dbError: error, reinitNonce: 0 });
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <DatabaseRecoveryScreen />
    </SafeAreaProvider>,
  );
};

describe('DatabaseRecoveryScreen', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('shows a selectable code with the migration version and cause', () => {
    renderWithError(new DatabaseMigrationError(9, new Error('disk I/O error')));

    const code = screen.getByText('Kod: v9 · disk I/O error');
    expect(code.props.selectable).toBe(true);
  });

  test('shows the version alone when the cause is not an Error', () => {
    renderWithError(new DatabaseMigrationError(9, 'weird'));
    expect(screen.getByText('Kod: v9')).toBeTruthy();
  });

  test('shows the version alone when there is no cause', () => {
    renderWithError(new DatabaseMigrationError(4));
    expect(screen.getByText('Kod: v4')).toBeTruthy();
  });

  test('tells the user where to send the screenshot', () => {
    renderWithError(new DatabaseMigrationError(9, new Error('x')));
    const email = screen.getByText(SUPPORT_EMAIL);
    expect(email.props.selectable).toBe(true);
  });

  test('reset asks for confirmation that it cannot be undone', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    renderWithError(new DatabaseMigrationError(9, new Error('x')));

    fireEvent.press(screen.getByText('Zresetuj bazę'));

    expect(alert).toHaveBeenCalledTimes(1);
    expect(String(alert.mock.calls[0][1])).toMatch(/nie da się cofnąć/);
  });
});
