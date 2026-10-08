import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {Content} from '../files/Content.js';
import type {Diff} from './diff.js';
import {concurrently} from '../files/concurrently.js';
import {writeEntries} from '../files/writeEntries.js';

/**
 * Write the changes to a directory: create and modify files, and delete files (along with any directories left
 * empty by deleting them).
 *
 * Files which were loaded from disk and haven't changed are copied natively rather than read into memory.
 *
 * @example
 * await apply(dir, await diff(before, after));
 */
export async function apply(dir: string, diff: Diff): Promise<void> {
  const root = path.resolve(dir);

  const writes: [string, Content][] = [];
  const deletes: string[] = [];
  for (const [file, change] of diff) {
    if (change.type === 'delete') {
      deletes.push(file);
    } else {
      writes.push([file, change.content]);
    }
  }

  // a file copied or moved within the directory may be overwritten or deleted before it has been copied, e.g.
  // when swapping two files, so those sources are read into memory before anything is written. Real paths are
  // compared, so the directory can be given with a different spelling or through a symlink.
  const realRoot = await realpathIfExists(root);
  if (realRoot !== undefined) {
    await concurrently({
      items: writes.entries(),
      task: async ([index, [file, content]]) => {
        if (content instanceof Uint8Array) return;
        const relative = path.relative(
          realRoot,
          await fs.realpath(content.path),
        );
        const source = relative.split(path.sep).join('/');
        if (diff.has(source)) writes[index] = [file, await content.read()];
      },
    });
  }

  // deletes go first so a deleted file can be replaced by a directory of the same name
  await concurrently({
    items: deletes,
    task: async (file) => {
      await fs.rm(path.join(root, file), {force: true});
    },
  });
  await removeEmptyDirectories({root, files: deletes});

  await writeEntries({dir: root, entries: writes});
}

interface RemoveEmptyDirectoriesOptions {
  root: string;
  files: string[];
}

async function removeEmptyDirectories({
  root,
  files,
}: RemoveEmptyDirectoriesOptions): Promise<void> {
  const directories = new Set<string>();
  for (const file of files) {
    for (
      let directory = path.posix.dirname(file);
      directory !== '.';
      directory = path.posix.dirname(directory)
    ) {
      directories.add(directory);
    }
  }
  // deepest first, so a parent is only removed once its children have been
  const deepestFirst = [...directories].sort(
    (a, b) => b.split('/').length - a.split('/').length,
  );
  for (const directory of deepestFirst) {
    try {
      await fs.rmdir(path.join(root, directory));
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error.code === 'ENOTEMPTY' ||
          error.code === 'EEXIST' ||
          error.code === 'ENOENT')
      ) {
        continue;
      }
      throw error;
    }
  }
}

async function realpathIfExists(file: string): Promise<string | undefined> {
  try {
    return await fs.realpath(file);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}
