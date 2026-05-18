import { useFocusEffect } from 'expo-router';
import { DependencyList, useCallback } from 'react';

export const useRefreshOnFocus = (
  callback: () => void,
  deps: DependencyList = [],
) => {
  // Generic refresh wrapper: `callback` and `deps` are intentionally
  // caller-provided, so exhaustive-deps cannot statically verify them.
  // The caller owns the dependency contract here.
  /* eslint-disable react-hooks/exhaustive-deps */
  useFocusEffect(
    useCallback(() => {
      callback();
    }, deps),
  );
  /* eslint-enable react-hooks/exhaustive-deps */
};
