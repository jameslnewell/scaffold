import type {Task} from './Task.js';

/**
 * A task which runs the tasks at the same time. When one fails, the others are left to finish before the failure
 * is thrown, or an `AggregateError` of every failure when several fail.
 *
 * @example
 * parallel([npm.run('build'), npm.run('lint')])
 */
export function parallel(tasks: Task[]): Task {
  return async (ctx) => {
    // starts each task in a promise, so a task which throws synchronously doesn't stop the others being awaited
    const results = await Promise.allSettled(
      tasks.map((task) => Promise.resolve().then(() => task(ctx))),
    );
    const failures = results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason as unknown);
    if (failures.length === 1) throw failures[0];
    if (failures.length > 1) {
      throw new AggregateError(
        failures,
        `${String(failures.length)} tasks failed`,
      );
    }
  };
}
