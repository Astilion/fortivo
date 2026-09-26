import * as Sentry from '@sentry/react-native';

const isDev = __DEV__;

// A failing autosave retries every 500 ms and would burn the per-session event
// budget; keying on the cause too keeps distinct failures separate.
const reportedKeys = new Set<string>();

const report = (message: string, error: unknown) => {
  const key = `${message}|${error instanceof Error ? error.message : ''}`;
  if (reportedKeys.has(key)) return;
  reportedKeys.add(key);

  if (error instanceof Error) {
    Sentry.captureException(error, { tags: { logger_message: message } });
  } else {
    Sentry.captureMessage(message, 'error');
  }
};

export const logger = {
  log: (message: string, data?: any) => {
    if (isDev) console.log(`[LOG] ${message}`, data ?? '');
  },
  warn: (message: string, data?: any) => {
    if (isDev) console.warn(`[WARN] ${message}`, data ?? '');
  },
  error: (message: string, error?: any) => {
    if (isDev) {
      console.error(`[ERROR] ${message}`, error ?? '');
      return;
    }
    report(message, error);
  },
  db: (message: string, data?: any) => {
    if (isDev) console.log(`[DB] ${message}`, data ?? '');
  },
};
