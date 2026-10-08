import type {Task} from './Task.js';

/**
 * A task which runs each task after the previous one has finished, skipping the rest when one fails.
 *
 * @example
 * serial([npm.install(), git.init()])
 */
export function serial(tasks: Task[]): Task {
  return async (ctx) => {
    for (const task of tasks) {
      await task(ctx);
    }
  };
}
