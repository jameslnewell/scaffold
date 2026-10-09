import type {Diff} from '@buildscaffold/core/diff';

export interface TaskContext {
  /** The directory the changes were applied to */
  directory: string;
  /** The changes which were applied, so a task can skip itself when nothing it depends on changed */
  diff: Diff;
}

/**
 * Whether a function task should run. When tasks are planned, it's evaluated before any task runs, so it can't
 * depend on what an earlier task does.
 */
export type When = (ctx: TaskContext) => boolean | Promise<boolean>;

/** Tasks which run one after another. When one fails, the rest are skipped */
export interface SerialTasks {
  type: 'serial';
  tasks: Task[];
}

/** Tasks which run at the same time. When one fails, the others finish before the failure is thrown */
export interface ParallelTasks {
  type: 'parallel';
  tasks: Task[];
}

/**
 * A task which does some work, like running a command.
 *
 * @example
 * const greet: FunctionTask = {
 *   type: 'function',
 *   label: 'say hello',
 *   when: ({diff}) => diff.has('greeting.txt'),
 *   run: async () => console.log('Hello!'),
 * };
 */
export interface FunctionTask<Params extends object = Record<string, unknown>> {
  type: 'function';
  /** Shown before the task runs e.g. `npm install` */
  label: string;
  /** What the task will do, for inspecting the task in tests. `run` doesn't read them */
  params?: Params | undefined;
  /** Whether the task should run, defaults to always */
  when?: When | undefined;
  run: (ctx: TaskContext) => Promise<void>;
}

/**
 * A task to run after a scaffold's changes have been applied. Tasks are plain objects, so they can be inspected
 * and tested without running them.
 */
export type Task = SerialTasks | ParallelTasks | FunctionTask;
