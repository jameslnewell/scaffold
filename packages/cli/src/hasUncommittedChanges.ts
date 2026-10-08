import {execFile} from 'node:child_process';

/**
 * Whether the directory is inside a git repository with uncommitted changes. Returns `false` when it isn't in a
 * repository, doesn't exist, or git isn't installed.
 */
export function hasUncommittedChanges(directory: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile(
      'git',
      ['status', '--porcelain'],
      {cwd: directory},
      (error, stdout) => {
        resolve(error === null && stdout.trim() !== '');
      },
    );
  });
}
