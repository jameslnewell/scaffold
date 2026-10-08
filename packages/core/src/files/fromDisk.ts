import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {DiskContent} from './Content.js';
import {Files} from './Files.js';
import {matchesGlob} from './matchesGlob.js';

const DEFAULT_IGNORE = ['**/.git/**', '**/node_modules/**'];

export interface FromDiskOptions {
  /** Only load files which match this glob e.g. `src/**` */
  glob?: string | undefined;
  /** Skip files which match these globs. Replaces the defaults, `**\/.git/**` and `**\/node_modules/**` */
  ignore?: string[] | undefined;
}

/**
 * Load a tree from a directory on disk, keyed by paths relative to the directory.
 *
 * Paths are listed straight away, but contents are only read when they're needed. Dotfiles are loaded, and `*` and
 * `**` in `glob` and `ignore` match them. Symbolic links are skipped, and a directory which doesn't exist loads as
 * an empty tree.
 *
 * @example
 * const templates = await fromDisk(`${import.meta.dirname}/templates`);
 * const destination = await fromDisk(process.cwd(), {
 *   ignore: ['**\/.git/**', '**\/node_modules/**', 'dist/**'],
 * });
 */
export async function fromDisk(
  dir: string,
  {glob, ignore = DEFAULT_IGNORE}: FromDiskOptions = {},
): Promise<Files> {
  const root = path.resolve(dir);
  const isIgnored = (file: string): boolean =>
    ignore.some((pattern) => matchesGlob(file, pattern));

  const entries: [string, DiskContent][] = [];

  // walks the tree by hand rather than using fs.glob() because fs.glob() can't match dotfiles, and so ignored
  // directories like node_modules can be skipped without listing their contents
  const walk = async (relativeDirectory: string): Promise<void> => {
    let dirents;
    try {
      dirents = await fs.readdir(path.join(root, relativeDirectory), {
        withFileTypes: true,
      });
    } catch (error) {
      if (isNotFound(error) && relativeDirectory === '') return;
      throw error;
    }
    await Promise.all(
      dirents.map(async (dirent) => {
        const file = relativeDirectory
          ? `${relativeDirectory}/${dirent.name}`
          : dirent.name;
        if (dirent.isDirectory()) {
          // a trailing slash lets a pattern like `node_modules/**` match the directory itself
          if (!isIgnored(`${file}/`)) await walk(file);
        } else if (dirent.isFile()) {
          if (isIgnored(file)) return;
          if (glob !== undefined && !matchesGlob(file, glob)) return;
          entries.push([file, new DiskContent(path.join(root, file))]);
        }
      }),
    );
  };
  await walk('');

  return new Files(entries);
}

function isNotFound(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
