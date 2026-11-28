import * as SQLite from 'expo-sqlite';
import { isDeadConnectionError, reconnect } from '@/database/connection';
import { logger } from '@/utils/logger';

// expo-sqlite's withTransactionAsync is non-exclusive and its catch issues a
// nameless ROLLBACK on the single shared connection — it can cancel another
// caller's open transaction. Serialize every transaction through one chain so
// only one BEGIN..COMMIT is ever in flight.
let chain: Promise<unknown> = Promise.resolve();

// The retry stays inside the chain and repeats the whole task: a native
// binding can die mid-process (FORTIVO-8), and replaying a single statement
// would commit half a transaction. `db` must be the proxy from connection.ts
// so the retry reaches the new connection.
export function runInTransaction(
  db: SQLite.SQLiteDatabase,
  task: () => Promise<void>,
): Promise<void> {
  const run = async () => {
    try {
      await db.withTransactionAsync(task);
    } catch (error) {
      if (!isDeadConnectionError(error)) throw error;
      await reconnect();
      logger.error('Database connection lost, reconnected', error);
      await db.withTransactionAsync(task);
    }
  };
  const result = chain.then(run, run);
  chain = result.catch(() => {});
  return result;
}
