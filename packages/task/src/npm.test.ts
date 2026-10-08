import * as npm from './npm.js';
import {describe, expect, test} from 'vitest';
import type {Diff} from '@buildscaffold/core/diff';
import {planTasks} from './planTasks.js';

const change = {type: 'modify', content: new Uint8Array()} as const;

describe('npm', () => {
  test('install runs npm install', () => {
    expect(npm.install()).toMatchObject({
      label: 'npm install',
      params: {command: 'npm', args: ['install']},
    });
  });

  test.each<[string, Diff, boolean]>([
    ['package.json changed', new Map([['package.json', change]]), true],
    ['package.json did not change', new Map([['README.md', change]]), false],
  ])('install runs when %s', async (_, diff, expected) => {
    const plan = await planTasks(npm.install(), {directory: '/tmp', diff});
    expect(plan !== undefined).toBe(expected);
  });

  test('install checks package.json in its cwd', async () => {
    const diff: Diff = new Map([['packages/a/package.json', change]]);
    const plan = await planTasks(npm.install({cwd: 'packages/a'}), {
      directory: '/tmp',
      diff,
    });
    expect(plan).toBeDefined();
  });

  test('install checks package.json in an absolute cwd', async () => {
    const diff: Diff = new Map([['packages/a/package.json', change]]);
    const plan = await planTasks(npm.install({cwd: '/tmp/packages/a'}), {
      directory: '/tmp',
      diff,
    });
    expect(plan).toBeDefined();
  });
});
