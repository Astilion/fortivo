import { describe, test, expect, jest, afterEach } from '@jest/globals';

type Logger = typeof import('@/utils/logger').logger;
type SentryMock = {
  captureException: jest.Mock;
  captureMessage: jest.Mock;
};

// logger reads __DEV__ at module load, so each case needs a fresh registry;
// the Sentry mock is taken from that same registry.
const load = (dev: boolean) => {
  (global as unknown as { __DEV__: boolean }).__DEV__ = dev;
  let logger!: Logger;
  let sentry!: SentryMock;
  jest.isolateModules(() => {
    /* eslint-disable @typescript-eslint/no-require-imports */
    logger = require('@/utils/logger').logger;
    sentry = require('@sentry/react-native');
    /* eslint-enable @typescript-eslint/no-require-imports */
  });
  return { logger, sentry };
};

const originalDev = __DEV__;

describe('logger.error', () => {
  afterEach(() => {
    (global as unknown as { __DEV__: boolean }).__DEV__ = originalDev;
    jest.restoreAllMocks();
  });

  test('reports the same message and cause only once', () => {
    const { logger, sentry } = load(false);

    logger.error('Active workout autosave failed', new Error('FK failed'));
    logger.error('Active workout autosave failed', new Error('FK failed'));

    expect(sentry.captureException).toHaveBeenCalledTimes(1);
  });

  test('reports the same message with a different cause separately', () => {
    const { logger, sentry } = load(false);

    logger.error('Błąd zmiany kolejności', new Error('FK failed'));
    logger.error('Błąd zmiany kolejności', new Error('database is locked'));

    expect(sentry.captureException).toHaveBeenCalledTimes(2);
  });

  test('sends only the message for a non-Error value', () => {
    const { logger, sentry } = load(false);

    logger.error('Failed to toggle favorite:', { weight: 100 });

    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(sentry.captureMessage).toHaveBeenCalledWith(
      'Failed to toggle favorite:',
      'error',
    );
  });

  test('never calls Sentry in development', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { logger, sentry } = load(true);

    logger.error('Active workout autosave failed', new Error('FK failed'));

    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(sentry.captureMessage).not.toHaveBeenCalled();
  });
});
