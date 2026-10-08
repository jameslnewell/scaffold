import type {Diff} from '@buildscaffold/core/diff';

export interface TaskContext {
  /** The directory the changes were applied to */
  cwd: string;
  /** The changes which were applied, so a task can skip itself when nothing it depends on changed */
  diff: Diff;
}

/**
 * A side effect, like running a command, which runs after a scaffold's changes have been applied.
 *
 * @example
 * const installWhenNeeded: Task = async (ctx) => {
 *   if (ctx.diff.has('package.json')) await npm.install()(ctx);
 * };
 */
export type Task = (ctx: TaskContext) => Promise<void>;
