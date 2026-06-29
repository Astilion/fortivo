import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    rules: {
      'no-console': 'error',
    },
  },
  {
    files: ['utils/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    ignores: ['dist/*', 'expo-env.d.ts', '.expo/*'],
  },
]);
