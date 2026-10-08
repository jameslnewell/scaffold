import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {type ExecOptions, type ExecParams, exec} from './exec.js';
import type {FunctionTask} from './Task.js';
import {execFile} from 'node:child_process';

export type GitOptions = Pick<ExecOptions, 'cwd'>;

/**
 * A task which runs `git init`, only when the directory isn't already inside a git repository, e.g. a new package
 * in a monorepo isn't made into a repository of its own.
 *
 * @example
 * git.init()
 */
export function init({cwd}: GitOptions = {}): FunctionTask<ExecParams> {
  return exec('git', ['init'], {
    cwd,
    when: async ({directory}) =>
      !(await isInsideRepository(path.resolve(directory, cwd ?? '.'))),
  });
}

// the directory may not exist yet when the tasks are planned, so its nearest existing parent is checked
async function isInsideRepository(directory: string): Promise<boolean> {
  let existing = directory;
  while (!(await exists(existing)) && path.dirname(existing) !== existing) {
    existing = path.dirname(existing);
  }
  return new Promise((resolve) => {
    execFile(
      'git',
      ['rev-parse', '--is-inside-work-tree'],
      {cwd: existing},
      (error, stdout) => {
        resolve(error === null && stdout.trim() === 'true');
      },
    );
  });
}

async function exists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

/**
 * A task which stages every change with `git add --all`.
 *
 * @example
 * git.add()
 */
export function add({cwd}: GitOptions = {}): FunctionTask<ExecParams> {
  return exec('git', ['add', '--all'], {cwd});
}

/**
 * A task which commits the staged changes.
 *
 * @example
 * git.commit('Initial commit')
 */
export function commit(
  message: string,
  {cwd}: GitOptions = {},
): FunctionTask<ExecParams> {
  return exec('git', ['commit', '--message', message], {cwd});
}

export interface AddRemoteOptions extends GitOptions {
  name: string;
  url: string;
}

/**
 * A task which adds a remote.
 *
 * @example
 * git.addRemote({name: 'origin', url: 'git@github.com:owner/repo.git'})
 */
export function addRemote({
  name,
  url,
  cwd,
}: AddRemoteOptions): FunctionTask<ExecParams> {
  return exec('git', ['remote', 'add', name, url], {cwd});
}

export interface PushOptions extends GitOptions {
  /** Defaults to `origin` */
  remote?: string | undefined;
}

/**
 * A task which pushes the current branch, setting its upstream.
 *
 * @example
 * git.push()
 */
export function push({
  remote = 'origin',
  cwd,
}: PushOptions = {}): FunctionTask<ExecParams> {
  return exec('git', ['push', '--set-upstream', remote, 'HEAD'], {cwd});
}
