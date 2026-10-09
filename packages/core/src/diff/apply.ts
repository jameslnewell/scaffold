import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {Diff} from './diff.js';
import type {File} from '../files/File.js';
import {concurrently} from '../files/concurrently.js';

/**
 * Write the changes to a directory, creating it if it doesn't exist: create and modify files, and delete files
 * (along with any directories left empty by deleting them).
 *
 * Each file is written with its bytes and mode. Only the files in the diff are read, so unchanged files are never
 * read. They're read before anything is written, so files copied or moved within the directory are safe.
 *
 * To write a whole tree to an empty directory, diff it against an empty tree.
 *
 * @example
 * await apply(dir, await diff(before, after));
 * await apply(emptyDir, await diff(new Files(), files));
 */
export async function apply(dir: string, diff: Diff): Promise<void> {
  const root = path.resolve(dir);

  const writes: [string, File][] = [];
  const deletes: string[] = [];
  for (const [file, change] of diff) {
    if (change.type === 'delete') {
      deletes.push(file);
    } else {
      writes.push([file, change.file]);
    }
  }

  // the files are read before anything is deleted or written, since a file copied or moved within the directory
  // may be read from a path which is about to change, e.g. when swapping two files
  const contents = new Map<string, {bytes: Uint8Array; mode: number}>();
  await concurrently({
    items: writes,
    task: async ([file, value]) => {
      const [bytes, {mode}] = await Promise.all([value.bytes(), value.stat()]);
      contents.set(file, {bytes, mode});
    },
  });

  // deletes go first so a deleted file can be replaced by a directory of the same name
  await concurrently({
    items: deletes,
    task: async (file) => {
      await fs.rm(path.join(root, file), {force: true});
    },
  });
  await removeEmptyDirectories({root, files: deletes});

  const directories = new Set(
    writes.map(([file]) => path.dirname(path.join(root, file))),
  );
  await concurrently({
    items: directories,
    task: async (directory) => {
      await fs.mkdir(directory, {recursive: true});
    },
  });

  await concurrently({
    items: contents,
    task: async ([file, {bytes, mode}]) => {
      const destination = path.join(root, file);
      await fs.writeFile(destination, bytes);
      // Windows only has a read-only flag, so modes aren't applied there
      if (process.platform !== 'win32') await fs.chmod(destination, mode);
    },
  });
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
