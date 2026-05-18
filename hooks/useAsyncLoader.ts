import { ServiceError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { useCallback, useState } from 'react';

export const useAsyncLoader = <T>(
  loader: () => Promise<T>,
  initialValue: T,
) => {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await loader();
      setData(result);
    } catch (e) {
      const msg = e instanceof ServiceError ? e.userMessage : 'Wystąpił błąd';
      setError(msg);
      logger.error('useAsyncLoader failed', e);
    } finally {
      setLoading(false);
    }
  }, [loader]);

  return { data, loading, error, reload: load, setData };
};
