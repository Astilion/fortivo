import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { db, setConnection } from '@/database/connection';
import { runInTransaction } from '@/database/writeLock';
import { logger } from '@/utils/logger';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

jest.mock('@/utils/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), db: jest.fn() },
}));

const mockOpenDatabaseAsync = openDatabaseAsync as jest.MockedFunction<
  typeof openDatabaseAsync
>;
const mockLoggerError = logger.error as jest.Mock;

// Verbatim from Sentry FORTIVO-8 (0.6.8+27).
const DEAD_CONNECTION_ERROR = new Error(
  "Call to function 'NativeDatabase.prepareAsync' has been rejected.\n→ Caused by: java.lang.NullPointerException: java.lang.NullPointerException",
);

type Task = () => Promise<void>;

const makeConnection = (
  withTransactionAsync: (task: Task) => Promise<void>,
) => {
  const connection = {
    withTransactionAsync: jest.fn(withTransactionAsync),
    execAsync: jest.fn(async (_source: string) => {}),
  };
  return connection as typeof connection & SQLiteDatabase;
};

const liveConnection = () => makeConnection((task) => task());

const deadConnection = () =>
  makeConnection(async () => {
    throw DEAD_CONNECTION_ERROR;
  });

const insertTask = () =>
  jest.fn(async () => {
    await db.execAsync('INSERT INTO workouts DEFAULT VALUES');
  });

describe('runInTransaction reconnect', () => {
  beforeEach(() => {
    mockOpenDatabaseAsync.mockReset();
    mockLoggerError.mockReset();
  });

  test('a dead connection is replaced and the whole transaction runs once more', async () => {
    const dead = deadConnection();
    const fresh = liveConnection();
    setConnection(dead);
    mockOpenDatabaseAsync.mockResolvedValueOnce(fresh);
    const task = insertTask();

    await runInTransaction(db, task);

    expect(mockOpenDatabaseAsync).toHaveBeenCalledTimes(1);
    expect(mockOpenDatabaseAsync).toHaveBeenCalledWith('fortivo.db', {
      useNewConnection: true,
    });
    expect(fresh.execAsync).toHaveBeenCalledWith('PRAGMA journal_mode = WAL;');
    expect(fresh.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
    expect(dead.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(fresh.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(fresh.execAsync).toHaveBeenCalledWith(
      'INSERT INTO workouts DEFAULT VALUES',
    );
    expect(dead.execAsync).not.toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Database connection lost, reconnected',
      DEAD_CONNECTION_ERROR,
    );
  });

  test('any other error is rethrown without reconnecting', async () => {
    const failing = makeConnection(async () => {
      throw new Error('UNIQUE constraint failed: workouts.id');
    });
    setConnection(failing);

    await expect(runInTransaction(db, insertTask())).rejects.toThrow(
      'UNIQUE constraint failed',
    );

    expect(mockOpenDatabaseAsync).not.toHaveBeenCalled();
    expect(failing.withTransactionAsync).toHaveBeenCalledTimes(1);
  });

  test('a connection that is dead again after reconnecting fails without a third attempt', async () => {
    const dead = deadConnection();
    const deadAgain = deadConnection();
    setConnection(dead);
    mockOpenDatabaseAsync.mockResolvedValueOnce(deadAgain);

    await expect(runInTransaction(db, insertTask())).rejects.toBe(
      DEAD_CONNECTION_ERROR,
    );

    expect(mockOpenDatabaseAsync).toHaveBeenCalledTimes(1);
    expect(dead.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(deadAgain.withTransactionAsync).toHaveBeenCalledTimes(1);
  });

  test('a deliberately cleared connection is never reopened', async () => {
    setConnection(null);

    await expect(runInTransaction(db, insertTask())).rejects.toThrow(
      'Database connection is not set',
    );

    expect(mockOpenDatabaseAsync).not.toHaveBeenCalled();
  });
});

describe('db proxy', () => {
  test('is not a thenable, with or without a connection', async () => {
    setConnection(null);
    await expect(Promise.resolve(db)).resolves.toBe(db);

    setConnection(liveConnection());
    await expect(Promise.resolve(db)).resolves.toBe(db);
  });
});
