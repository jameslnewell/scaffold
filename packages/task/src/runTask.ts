import type {Task, TaskContext} from './Task.js';

/**
 * Run a task, skipping function tasks whose `when` is false.
 *
 * @example
 * await runTask(serial([npm.install(), git.init()]), {directory, diff});
 */
export async function runTask(task: Task, ctx: TaskContext): Promise<void> {
  switch (task.type) {
    case 'serial':
      for (const child of task.tasks) {
        await runTask(child, ctx);
      }
      return;
    case 'parallel': {
      // starts each task in a promise, so a task which throws synchronously doesn't stop the others being awaited
      const results = await Promise.allSettled(
        task.tasks.map((child) =>
          Promise.resolve().then(() => runTask(child, ctx)),
        ),
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
      return;
    }
    case 'function':
      if (task.when && !(await task.when(ctx))) return;
      await task.run(ctx);
      return;
  }
}
