import { useApp } from '@/providers/AppProvider';
import { useCallback, useState } from 'react';
import { UserSettings } from '@/types/training';
import { useFocusEffect } from 'expo-router';
import { logger } from '@/utils/logger';
import { LOCAL_USER_ID } from '@/constants/User';

export const useProfileSettings = () => {
  const { profileService } = useApp();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userSettings = await profileService.getUserSettings(LOCAL_USER_ID);
      setSettings(userSettings);
    } catch (err) {
      logger.error('Failed to load user settings', err);
      setError('Nie udało się załadować ustawień');
    } finally {
      setLoading(false);
    }
  }, [profileService]);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings]),
  );

  const updateSettings = useCallback(async () => {
    if (!settings) return;
    try {
      setLoading(true);
      setError(null);
      await profileService.updateUserSettings(settings);
    } catch (err) {
      logger.error('Failed to update user settings', err);
      setError('Nie udało się zaktualizować ustawień');
    } finally {
      setLoading(false);
    }
  }, [settings, profileService]);
  return {
    settings,
    setSettings,
    loading,
    error,
    refresh: loadSettings,
    updateSettings,
  };
};
