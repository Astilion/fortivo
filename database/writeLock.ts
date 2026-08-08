import * as SQLite from 'expo-sqlite';

// expo-sqlite's withTransactionAsync is non-exclusive and its catch issues a
// nameless ROLLBACK on the single shared connection — it can cancel another
// caller's open transaction. Serialize every transaction through one chain so
// only one BEGIN..COMMIT is ever in flight.
let chain: Promise<unknown> = Promise.resolve();

export function runInTransaction(
  db: SQLite.SQLiteDatabase,
  task: () => Promise<void>,
): Promise<void> {
  const run = () => db.withTransactionAsync(task);
  const result = chain.then(run, run);
  chain = result.catch(() => {});
  return result;
}
