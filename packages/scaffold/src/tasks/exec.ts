import * as path from 'node:path';
import {type ExecOptions, exec as execFn} from '../utilities/exec.js';
import type {Task} from '../types.js';

export function exec(
  cmd: string,
  args: string[],
  options: ExecOptions = {},
): Task {
  return async (ctx) => {
    // an explicit cwd is relative to the directory being scaffolded
    const cwd = options.cwd ? path.resolve(ctx.cwd, options.cwd) : ctx.cwd;
    await execFn(cmd, args, {...options, cwd});
  };
}
