import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import type {TaskContext} from '@buildscaffold/task';
import {createRepo} from './github.js';

const ctx: TaskContext = {cwd: process.cwd(), diff: new Map()};

describe(createRepo, () => {
  beforeEach(() => {
    vi.stubEnv('GITHUB_TOKEN', 'token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('throws when the name is not "owner/name"', async () => {
    await expect(createRepo('my-package')(ctx)).rejects.toThrow(
      'Expected a name like "owner/name" but received "my-package"',
    );
  });

  test('throws when there is no GITHUB_TOKEN', async () => {
    vi.stubEnv('GITHUB_TOKEN', '');
    await expect(createRepo('owner/name')(ctx)).rejects.toThrow('GITHUB_TOKEN');
  });
});
