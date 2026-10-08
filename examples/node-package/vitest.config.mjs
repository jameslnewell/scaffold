import {defineConfig, mergeConfig} from 'vitest/config';
import config from '@jameslnewell/vitest-config';

export default mergeConfig(
  config,
  defineConfig({
    ssr: {
      resolve: {
        conditions: ['@buildscaffold/source'],
      },
    },
  }),
);
