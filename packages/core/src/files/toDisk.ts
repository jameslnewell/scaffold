import type {Files} from './Files.js';
import {writeEntries} from './writeEntries.js';

/**
 * Write every file in the tree to a directory, creating it if it doesn't exist.
 *
 * Existing files which aren't in the tree are left alone, so this is best suited to empty directories and tests.
 * Use `diff` and `apply` from `@buildscaffold/core/diff` to update an existing directory.
 *
 * @example
 * await toDisk('./out', files);
 */
export async function toDisk(dir: string, files: Files): Promise<void> {
  await writeEntries({dir, entries: files});
}
