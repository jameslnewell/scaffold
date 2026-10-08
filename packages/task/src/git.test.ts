import * as fs from 'node:fs/promises';
import * as git from './git.js';
import * as os from 'node:os';
import * as path from 'node:path';
import {describe, expect, test} from 'vitest';
import type {TaskContext} from './Task.js';
import {planTasks} from './planTasks.js';

describe('git', () => {
  test('init does not run inside an existing repository, even in a directory which does not exist yet', async () => {
    const plan = await planTasks(git.init(), {
      directory: path.join(import.meta.dirname, 'missing', 'package'),
      diff: new Map(),
    });
    expect(plan).toBeUndefined();
  });

  test('init only runs when the directory is not a git repository', async () => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'buildscaffold-'),
    );
    try {
      const ctx: TaskContext = {directory, diff: new Map()};
      await expect(planTasks(git.init(), ctx)).resolves.toMatchObject({
        label: 'git init',
      });
      await git.init().run(ctx);
      await expect(planTasks(git.init(), ctx)).resolves.toBeUndefined();
    } finally {
      await fs.rm(directory, {recursive: true, force: true});
    }
  });

  test('commit passes the message as an argument', () => {
    expect(git.commit('Initial commit')).toMatchObject({
      params: {command: 'git', args: ['commit', '--message', 'Initial commit']},
    });
  });
});
