import type {FunctionTask, TaskContext} from './Task.js';
import {describe, expect, test, vi} from 'vitest';
import {parallel, serial} from './collections.js';
import {runTask} from './runTask.js';

const ctx: TaskContext = {directory: process.cwd(), diff: new Map()};

function task(
  label: string,
  run: FunctionTask['run'] = () => Promise.resolve(),
): FunctionTask {
  return {type: 'function', label, run: vi.fn(run)};
}

describe(runTask, () => {
  test('runs serial tasks in order with the context', async () => {
    const order: string[] = [];
    const first = task('first', async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      order.push('first');
    });
    const second = task('second', () => {
      order.push('second');
      return Promise.resolve();
    });
    await runTask(serial([first, second]), ctx);
    expect(order).toEqual(['first', 'second']);
    expect(first.run).toHaveBeenCalledWith(ctx);
  });

  test('skips the remaining serial tasks when one fails', async () => {
    const remaining = task('remaining');
    await expect(
      runTask(
        serial([
          task('failing', () => Promise.reject(new Error('failed'))),
          remaining,
        ]),
        ctx,
      ),
    ).rejects.toThrow('failed');
    expect(remaining.run).not.toHaveBeenCalled();
  });

  test('lets the other parallel tasks finish when one fails', async () => {
    let finished = false;
    await expect(
      runTask(
        parallel([
          task('failing', () => Promise.reject(new Error('failed'))),
          task('slow', async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            finished = true;
          }),
        ]),
        ctx,
      ),
    ).rejects.toThrow('failed');
    expect(finished).toBe(true);
  });

  test('throws every failure when several parallel tasks fail', async () => {
    await expect(
      runTask(
        parallel([
          task('first', () => Promise.reject(new Error('first'))),
          task('second', () => {
            throw new Error('second');
          }),
        ]),
        ctx,
      ),
    ).rejects.toThrow(AggregateError);
  });

  test('skips a function task whose when is false', async () => {
    const skipped = {...task('skipped'), when: () => false};
    await runTask(skipped, ctx);
    expect(skipped.run).not.toHaveBeenCalled();
  });
});
