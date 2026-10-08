import * as path from 'node:path';
import type {FunctionTask, When} from './Task.js';
import {spawn} from 'node:child_process';

export interface ExecOptions {
  /** The directory to run the command in, relative to the scaffolded directory */
  cwd?: string | undefined;
  /** Whether the command should run, defaults to always */
  when?: When | undefined;
}

export type ExecParams = {
  command: string;
  args: string[];
  cwd?: string | undefined;
};

/**
 * A task which runs a command, showing its output, and fails when it exits with a non-zero code. Its label is the
 * command.
 *
 * @example
 * exec('npx', ['prettier', '--write', '.'])
 */
export function exec(
  command: string,
  args: string[],
  {cwd, when}: ExecOptions = {},
): FunctionTask<ExecParams> {
  const label = [command, ...args].join(' ');
  const task: FunctionTask<ExecParams> = {
    type: 'function',
    label: cwd === undefined ? label : `${label} (in ${cwd})`,
    params: cwd === undefined ? {command, args} : {command, args, cwd},
    run: (ctx) =>
      new Promise<void>((resolve, reject) => {
        const child = spawn(command, args, {
          cwd: path.resolve(ctx.directory, cwd ?? '.'),
          stdio: 'inherit',
        });
        child.on('error', reject);
        child.on('exit', (code, signal) => {
          if (code === 0) {
            resolve();
          } else {
            reject(
              new Error(
                `Command "${label}" exited with code=${String(code)} signal=${String(signal)}`,
              ),
            );
          }
        });
      }),
  };
  if (when !== undefined) task.when = when;
  return task;
}
