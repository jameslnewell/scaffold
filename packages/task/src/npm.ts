import {type ExecOptions, exec} from './exec.js';
import type {Task} from './Task.js';

/**
 * A task which runs `npm install`.
 *
 * @example
 * npm.install()
 */
export function install(options: ExecOptions = {}): Task {
  return exec('npm', ['install'], options);
}

/**
 * A task which runs a script from `package.json` with `npm run`.
 *
 * @example
 * npm.run('build')
 */
export function run(script: string, options: ExecOptions = {}): Task {
  return exec('npm', ['run', script], options);
}
