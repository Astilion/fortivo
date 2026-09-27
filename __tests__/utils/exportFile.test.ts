import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { shareExportFile } from '@/utils/exportFile';

type MockFile = {
  name: string;
  uri: string;
  exists: boolean;
  create: jest.Mock<() => void>;
  write: jest.Mock<(content: string) => void>;
  delete: jest.Mock<() => void>;
};

const mockCreatedFiles: MockFile[] = [];
let mockSetupNextFile: ((file: MockFile) => void) | null = null;

jest.mock('expo-file-system', () => ({
  Paths: { cache: 'cache' },
  File: jest.fn((_dir: string, name: string) => {
    const file: MockFile = {
      name,
      uri: `file:///cache/${name}`,
      exists: false,
      create: jest.fn(() => {
        file.exists = true;
      }),
      write: jest.fn(),
      delete: jest.fn(() => {
        file.exists = false;
      }),
    };
    mockSetupNextFile?.(file);
    mockSetupNextFile = null;
    mockCreatedFiles.push(file);
    return file;
  }),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), db: jest.fn() },
}));

const mockIsAvailable = Sharing.isAvailableAsync as jest.MockedFunction<
  typeof Sharing.isAvailableAsync
>;
const mockShare = Sharing.shareAsync as jest.MockedFunction<
  typeof Sharing.shareAsync
>;

const mockFileCtor = File as unknown as jest.Mock;

const nextFile = (setup: (file: MockFile) => void) => {
  mockSetupNextFile = setup;
};

describe('shareExportFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreatedFiles.length = 0;
    mockSetupNextFile = null;
    mockIsAvailable.mockResolvedValue(true);
    mockShare.mockResolvedValue(undefined);
  });

  test('shares the file and removes it afterwards', async () => {
    await expect(shareExportFile('{}')).resolves.toBe('shared');
    expect(mockCreatedFiles[0].write).toHaveBeenCalledWith('{}');
    expect(mockCreatedFiles[0].delete).toHaveBeenCalledTimes(1);
  });

  test('removes a partially written file when writing fails', async () => {
    const writeError = new Error('ENOSPC');
    nextFile((file) => {
      file.write.mockImplementation(() => {
        throw writeError;
      });
    });

    await expect(shareExportFile('{}')).rejects.toBe(writeError);
    expect(mockCreatedFiles[0].delete).toHaveBeenCalledTimes(1);
  });

  test('rethrows the original error when creating the file fails', async () => {
    const createError = new Error('EACCES');
    nextFile((file) => {
      file.create.mockImplementation(() => {
        throw createError;
      });
    });

    await expect(shareExportFile('{}')).rejects.toBe(createError);
    expect(mockCreatedFiles[0].delete).not.toHaveBeenCalled();
  });

  test('a failing cleanup does not mask the write error', async () => {
    const writeError = new Error('ENOSPC');
    nextFile((file) => {
      file.write.mockImplementation(() => {
        throw writeError;
      });
      file.delete.mockImplementation(() => {
        throw new Error('cleanup');
      });
    });

    await expect(shareExportFile('{}')).rejects.toBe(writeError);
  });

  test('names the file with the local date after midnight', async () => {
    await shareExportFile('{}', new Date(2026, 8, 27, 0, 30));
    expect(mockCreatedFiles[0].name).toBe('fortivo-export-2026-09-27.json');
  });

  test('does not create a file when sharing is unavailable', async () => {
    mockIsAvailable.mockResolvedValue(false);

    await expect(shareExportFile('{}')).resolves.toBe('unavailable');
    expect(mockFileCtor).not.toHaveBeenCalled();
  });
});
