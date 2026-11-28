import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { applyConnectionPragmas, DB_NAME } from '@/database/database';

const DEAD_CONNECTION_PATTERN =
  /NullPointerException|already released|valid id|Access to closed resource/;

let current: SQLiteDatabase | null = null;

export const setConnection = (connection: SQLiteDatabase | null) => {
  current = connection;
};

// Services hold this proxy instead of a connection so a reconnect swaps the
// native handle under every caller at once.
export const db = new Proxy({} as SQLiteDatabase, {
  get(_target, property) {
    // Without this the proxy looks like a thenable: `await db` or
    // Promise.resolve(db) would call into it and throw.
    if (property === 'then') return undefined;
    if (!current) throw new Error('Database connection is not set');
    const value = Reflect.get(current, property, current);
    return typeof value === 'function' ? value.bind(current) : value;
  },
});

const messageOf = (value: unknown) =>
  value instanceof Error ? value.message : '';

export const isDeadConnectionError = (error: unknown) =>
  error instanceof Error &&
  DEAD_CONNECTION_PATTERN.test(`${error.message}\n${messageOf(error.cause)}`);

export const reconnect = async () => {
  const failed = current;
  if (!failed) throw new Error('Database connection is not set');

  // The native module caches connections by path; without useNewConnection it
  // hands back the same dead NativeDatabase (its binding was reset by
  // sharedObjectDidRelease while isClosed stayed false).
  const next = await openDatabaseAsync(DB_NAME, { useNewConnection: true });
  await applyConnectionPragmas(next);

  if (current !== failed) {
    await next.closeAsync().catch(() => {});
    throw new Error('Database connection changed during reconnect');
  }
  current = next;
};
