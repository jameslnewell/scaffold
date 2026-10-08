import type {Task, TaskContext} from './Task.js';
import {describe, expect, test, vi} from 'vitest';
import {serial} from './serial.js';

const ctx: TaskContext = {cwd: process.cwd(), diff: new Map()};

describe(serial, () => {
  test('runs each task in order with the context', async () => {
    const order: number[] = [];
    const task = (n: number): Task =>
      vi.fn<Task>(async () => {
        await new Promise((resolve) => setTimeout(resolve, 3 - n));
        order.push(n);
      });
    const first = task(1);
    await serial([first, task(2)])(ctx);
    expect(order).toEqual([1, 2]);
    expect(first).toHaveBeenCalledWith(ctx);
  });

  test('skips the remaining tasks when one fails', async () => {
    const remaining = vi.fn<Task>();
    await expect(
      serial([() => Promise.reject(new Error('failed')), remaining])(ctx),
    ).rejects.toThrow('failed');
    expect(remaining).not.toHaveBeenCalled();
  });
});
