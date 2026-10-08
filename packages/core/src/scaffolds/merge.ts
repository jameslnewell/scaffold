import * as path from 'node:path';
import {Files, fromDisk} from '../files/index.js';
import type {Scaffold} from './Scaffold.js';

export interface MergeOptions {
  /** A directory to merge the tree into e.g. `src` */
  to?: string | undefined;
}

/**
 * A scaffold which overlays another tree, or the files in a directory, onto the destination.
 *
 * Files in the destination with the same path are replaced by the merged files, which keep their modes. A
 * directory is loaded with `fromDisk()` when the scaffold runs.
 *
 * @example
 * merge(new URL('../files', import.meta.url))
 * merge(`${import.meta.dirname}/templates`, {to: 'src'})
 */
export function merge(
  tree: Files | Promise<Files> | string | URL,
  {to = '.'}: MergeOptions = {},
): Scaffold {
  // a tree which fails to load is reported when the scaffold runs, rather than crashing the process with an
  // unhandled rejection before then
  if (tree instanceof Promise) tree.catch(() => undefined);
  return async (files) => {
    const overlay =
      typeof tree === 'string' || tree instanceof URL
        ? await fromDisk(tree)
        : await tree;
    return new Files([
      ...files,
      ...[...overlay].map(
        ([file, content]) => [path.posix.join(to, file), content] as const,
      ),
    ]);
  };
}
