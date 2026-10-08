import {defineConfig, globalIgnores} from 'eslint/config';
import config from '@jameslnewell/eslint-config/node';

export default defineConfig([
  globalIgnores(['dist', 'tmp']),
  config,
  {
    // TODO: remove once https://github.com/jameslnewell/configs/pull/58 is released
    files: ['**/*.test.ts'],
    settings: {
      vitest: {
        typecheck: true,
      },
    },
  },
]);
