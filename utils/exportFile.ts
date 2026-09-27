import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { localDateString } from '@/utils/date';
import { logger } from '@/utils/logger';

export const shareExportFile = async (
  json: string,
  now: Date = new Date(),
): Promise<'shared' | 'unavailable'> => {
  if (!(await Sharing.isAvailableAsync())) {
    return 'unavailable';
  }

  const file = new File(
    Paths.cache,
    `fortivo-export-${localDateString(now)}.json`,
  );
  try {
    file.create({ overwrite: true });
    file.write(json);
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Eksport danych Fortivo',
    });
    return 'shared';
  } finally {
    // A full health-data dump must not linger in the cache, including a
    // partial one left by a failed write.
    if (file.exists) {
      try {
        file.delete();
      } catch (cleanupError) {
        logger.error('Failed to clean up export file', cleanupError);
      }
    }
  }
};
