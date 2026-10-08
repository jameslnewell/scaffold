import * as path from 'node:path';
import type {Task} from './Task.js';
import {spawn} from 'node:child_process';

export interface ExecOptions {
  /** The directory to run the command in, relative to the scaffolded directory */
  cwd?: string | undefined;
}

/**
 * A task which runs a command, showing its output, and fails when it exits with a non-zero code.
 *
 * @example
 * exec('npx', ['prettier', '--write', '.'])
 */
export function exec(
  cmd: string,
  args: string[],
  options: ExecOptions = {},
): Task {
  return (ctx) => {
    const cwd = path.resolve(ctx.cwd, options.cwd ?? '.');
    return new Promise<void>((resolve, reject) => {
      const child = spawn(cmd, args, {cwd, stdio: 'inherit'});
      child.on('error', reject);
      child.on('exit', (code, signal) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(
              `Command "${[cmd, ...args].join(' ')}" exited with code=${String(code)} signal=${String(signal)}`,
            ),
          );
        }
      });
    });
  };
}
