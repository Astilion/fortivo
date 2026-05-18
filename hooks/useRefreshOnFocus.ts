import { useFocusEffect } from 'expo-router';
import { DependencyList, useCallback } from 'react';

export const useRefreshOnFocus = (
  callback: () => void,
  deps: DependencyList = [],
) => {
  useFocusEffect(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useCallback(() => {
      callback();
    }, deps),
  );
};
