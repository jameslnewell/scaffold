import * as path from 'node:path';
import {type ExecOptions, type ExecParams, exec} from './exec.js';
import type {FunctionTask} from './Task.js';

export type NpmOptions = Pick<ExecOptions, 'cwd'>;

/**
 * A task which runs `npm install`, only when `package.json` changed.
 *
 * @example
 * npm.install()
 */
export function install({cwd}: NpmOptions = {}): FunctionTask<ExecParams> {
  return exec('npm', ['install'], {
    cwd,
    when: ({directory, diff}) => {
      // the diff is keyed by POSIX paths relative to the directory, while cwd may be absolute or use backslashes
      const relative = path
        .relative(directory, path.resolve(directory, cwd ?? '.'))
        .split(path.sep)
        .join('/');
      return diff.has(path.posix.join(relative || '.', 'package.json'));
    },
  });
}

/**
 * A task which runs a script from `package.json` with `npm run`.
 *
 * @example
 * npm.run('build')
 */
export function run(
  script: string,
  {cwd}: NpmOptions = {},
): FunctionTask<ExecParams> {
  return exec('npm', ['run', script], {cwd});
}
