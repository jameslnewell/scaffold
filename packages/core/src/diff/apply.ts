import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {Diff} from './diff.js';
import {DiskFile} from '../files/DiskFile.js';
import type {File} from '../files/File.js';
import {concurrently} from '../files/concurrently.js';
import {modeOf} from '../files/modeOf.js';

/**
 * Write the changes to a directory, creating it if it doesn't exist: create and modify files, and delete files
 * (along with any directories left empty by deleting them).
 *
 * Files which were loaded from disk are copied natively rather than read into memory. A file with a mode gets
 * that mode, and a file without one gets the default mode when it's created and keeps its mode when it's modified.
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

  // a file copied or moved within the directory may be overwritten or deleted before it has been copied, e.g.
  // when swapping two files, so those sources are read into memory before anything is written. Real paths are
  // compared, so the directory can be given with a different spelling or through a symlink.
  const preloaded = new Set<File>();
  const realRoot = await realpathIfExists(root);
  if (realRoot !== undefined) {
    await concurrently({
      items: writes,
      task: async ([, value]) => {
        if (!(value instanceof DiskFile)) return;
        const relative = path.relative(realRoot, await fs.realpath(value.path));
        if (!diff.has(relative.split(path.sep).join('/'))) return;
        // the read and the stat are cached on the file, so they're kept until it's written
        await Promise.all([value.bytes(), value.stat()]);
        preloaded.add(value);
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
    items: writes,
    task: async ([file, value]) => {
      const destination = path.join(root, file);
      if (value instanceof DiskFile && !preloaded.has(value)) {
        // copies natively (or clones where the filesystem supports it) so the bytes never pass through JS, along
        // with the source's mode
        await fs.copyFile(
          value.path,
          destination,
          fs.constants.COPYFILE_FICLONE,
        );
        return;
      }
      // writeFile() keeps the mode of an existing file, so a file without a mode keeps its mode
      await fs.writeFile(destination, await value.bytes());
      // Windows only has a read-only flag, so modes aren't applied there
      if (process.platform !== 'win32') {
        const mode = await modeOf(value);
        if (mode !== undefined) await fs.chmod(destination, mode);
      }
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
