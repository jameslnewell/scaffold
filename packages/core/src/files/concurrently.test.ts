import {describe, expect, test, vi} from 'vitest';
import {concurrently} from './concurrently.js';

describe(concurrently, () => {
  test('runs no more than the concurrency at once', async () => {
    let running = 0;
    let maximum = 0;
    await concurrently({
      items: Array.from({length: 20}, (_, i) => i),
      concurrency: 3,
      task: async () => {
        maximum = Math.max(maximum, ++running);
        await new Promise((resolve) => setTimeout(resolve, 1));
        --running;
      },
    });
    expect(maximum).toBe(3);
  });

  test('stops starting items once one fails', async () => {
    const task = vi.fn(async (item: number) => {
      await Promise.resolve();
      if (item === 0) throw new Error('failed');
    });
    await expect(
      concurrently({items: [0, 1, 2, 3], concurrency: 1, task}),
    ).rejects.toThrow('failed');
    expect(task).toHaveBeenCalledTimes(1);
  });
});
