const isDev = __DEV__;

export const logger = {
  log: (message: string, data?: any) => {
    if (isDev) console.log(`[LOG] ${message}`, data ?? '');
  },
  warn: (message: string, data?: any) => {
    if (isDev) console.warn(`[WARN] ${message}`, data ?? '');
  },
  error: (message: string, error?: any) => {
    if (isDev) console.error(`[ERROR] ${message}`, error ?? '');
  },
  db: (message: string, data?: any) => {
    if (isDev) console.log(`[DB] ${message}`, data ?? '');
  },
};
