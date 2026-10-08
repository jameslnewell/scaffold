import {describe, expect, test} from 'vitest';
import type {TaskContext} from './Task.js';
import {parallel} from './parallel.js';

const ctx: TaskContext = {cwd: process.cwd(), diff: new Map()};

describe(parallel, () => {
  test('lets the other tasks finish when one fails', async () => {
    let finished = false;
    await expect(
      parallel([
        () => Promise.reject(new Error('failed')),
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          finished = true;
        },
      ])(ctx),
    ).rejects.toThrow('failed');
    expect(finished).toBe(true);
  });

  test('throws every failure when several fail', async () => {
    await expect(
      parallel([
        () => Promise.reject(new Error('first')),
        () => {
          throw new Error('second');
        },
      ])(ctx),
    ).rejects.toThrow(AggregateError);
  });
});
