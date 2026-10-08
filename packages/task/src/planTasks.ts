import type {FunctionTask, Task, TaskContext} from './Task.js';

/**
 * The tasks which would run, without running them: function tasks whose `when` is false are removed, along with
 * collections left empty. Returns `undefined` when nothing would run.
 *
 * Every `when` is evaluated now, before any task runs (and, in the CLI, before the changes are applied), so a
 * condition can't depend on what an earlier task does. The planned function tasks no longer have a `when`, so
 * running the plan runs exactly what was planned.
 *
 * @example
 * const plan = await planTasks(tasks, {directory, diff});
 * if (plan) await runTask(plan, {directory, diff});
 */
export async function planTasks(
  task: Task,
  ctx: TaskContext,
): Promise<Task | undefined> {
  if (task.type === 'function') {
    if (task.when && !(await task.when(ctx))) return undefined;
    const planned: FunctionTask = {
      type: 'function',
      label: task.label,
      run: task.run,
    };
    if (task.params !== undefined) planned.params = task.params;
    return planned;
  }

  const children: Task[] = [];
  for (const child of task.tasks) {
    const planned = await planTasks(child, ctx);
    if (planned) children.push(planned);
  }
  return children.length > 0 ? {type: task.type, tasks: children} : undefined;
}

/**
 * The labels of the function tasks in a task, in the order they'd start.
 *
 * @example
 * labelsOf(serial([npm.install(), git.init()])); // ['npm install', 'git init']
 */
export function labelsOf(task: Task): string[] {
  return task.type === 'function'
    ? [task.label]
    : task.tasks.flatMap((child) => labelsOf(child));
}
