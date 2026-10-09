import type {File} from '../files/File.js';
import type {Files} from '../files/Files.js';
import {concurrently} from '../files/concurrently.js';

export type Change =
  | {type: 'create'; file: File}
  | {type: 'modify'; file: File}
  | {type: 'delete'};

/**
 * The changes between two trees, keyed by path and sorted by path.
 *
 * @example
 * if (changes.has('package.json')) console.log('package.json changed');
 */
export type Diff = ReadonlyMap<string, Change>;

/**
 * Compare two trees, typically the tree loaded from disk and the tree a scaffold produced.
 *
 * Files only in `after` are created, files only in `before` are deleted, and files in both are modified when
 * their sizes, modes or bytes differ, checked in that order. Modes are ignored on Windows. Files which are still
 * the same object as in `before` are unchanged without being read, so only the files a scaffold replaced are
 * compared.
 *
 * @example
 * const before = await fromDisk(dir);
 * const after = await scaffold(before);
 * const changes = await diff(before, after);
 */
export async function diff(before: Files, after: Files): Promise<Diff> {
  const changes = new Map<string, Change>();

  const replaced: [string, File][] = [];
  for (const [file, value] of after) {
    const previous = before.get(file);
    if (previous === undefined) {
      changes.set(file, {type: 'create', file: value});
    } else if (previous !== value) {
      replaced.push([file, value]);
    }
  }
  for (const file of before.keys()) {
    if (!after.has(file)) changes.set(file, {type: 'delete'});
  }

  await concurrently({
    items: replaced,
    task: async ([file, value]) => {
      const previous = before.get(file);
      if (previous === undefined) return;
      if (!(await isSame(previous, value))) {
        changes.set(file, {type: 'modify', file: value});
      }
    },
  });

  return new Map([...changes].sort(([a], [b]) => (a < b ? -1 : 1)));
}

// the bytes are only read when the sizes and modes match
async function isSame(a: File, b: File): Promise<boolean> {
  const [statsA, statsB] = await Promise.all([a.stat(), b.stat()]);
  if (statsA.size !== statsB.size) return false;
  // modes aren't applied on Windows, which only has a read-only flag, so they can't differ there
  if (
    process.platform !== 'win32' &&
    (statsA.mode & 0o7777) !== (statsB.mode & 0o7777)
  ) {
    return false;
  }
  const [bytesA, bytesB] = await Promise.all([a.bytes(), b.bytes()]);
  return Buffer.from(
    bytesA.buffer,
    bytesA.byteOffset,
    bytesA.byteLength,
  ).equals(bytesB);
}
