import type {ParallelTasks, SerialTasks, Task} from './Task.js';

/**
 * Tasks which run one after another. When one fails, the rest are skipped.
 *
 * @example
 * serial([npm.install(), git.init()])
 */
export function serial(tasks: Task[]): SerialTasks {
  return {type: 'serial', tasks};
}

/**
 * Tasks which run at the same time. When one fails, the others finish before the failure is thrown, or an
 * `AggregateError` of every failure when several fail.
 *
 * @example
 * parallel([npm.run('build'), npm.run('lint')])
 */
export function parallel(tasks: Task[]): ParallelTasks {
  return {type: 'parallel', tasks};
}
