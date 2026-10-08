import {type ExecOptions, exec} from './exec.js';
import type {Task} from './Task.js';

/**
 * A task which runs `git init`.
 *
 * @example
 * git.init()
 */
export function init(options: ExecOptions = {}): Task {
  return exec('git', ['init'], options);
}

/**
 * A task which stages every change with `git add --all`.
 *
 * @example
 * git.add()
 */
export function add(options: ExecOptions = {}): Task {
  return exec('git', ['add', '--all'], options);
}

/**
 * A task which commits the staged changes.
 *
 * @example
 * git.commit('Initial commit')
 */
export function commit(message: string, options: ExecOptions = {}): Task {
  return exec('git', ['commit', '--message', message], options);
}

export interface AddRemoteOptions extends ExecOptions {
  name: string;
  url: string;
}

/**
 * A task which adds a remote.
 *
 * @example
 * git.addRemote({name: 'origin', url: 'git@github.com:owner/repo.git'})
 */
export function addRemote({name, url, ...options}: AddRemoteOptions): Task {
  return exec('git', ['remote', 'add', name, url], options);
}

export interface PushOptions extends ExecOptions {
  /** Defaults to `origin` */
  remote?: string | undefined;
}

/**
 * A task which pushes the current branch, setting its upstream.
 *
 * @example
 * git.push()
 */
export function push({remote = 'origin', ...options}: PushOptions = {}): Task {
  return exec('git', ['push', '--set-upstream', remote, 'HEAD'], options);
}
