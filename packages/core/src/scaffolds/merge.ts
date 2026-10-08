import * as path from 'node:path';
import {Files} from '../files/index.js';
import type {Scaffold} from './Scaffold.js';

export interface MergeOptions {
  /** A directory to merge the tree into e.g. `src` */
  to?: string | undefined;
}

/**
 * A scaffold which overlays another tree, replacing files with the same path.
 *
 * @example
 * merge(fromDisk(`${import.meta.dirname}/templates`), {to: 'src'})
 */
export function merge(
  tree: Files | Promise<Files>,
  {to = '.'}: MergeOptions = {},
): Scaffold {
  // a tree which fails to load is reported when the scaffold runs, rather than crashing the process with an
  // unhandled rejection before then
  if (tree instanceof Promise) tree.catch(() => undefined);
  return async (files) => {
    const overlay = await tree;
    return new Files([
      ...files,
      ...[...overlay].map(
        ([file, content]) => [path.posix.join(to, file), content] as const,
      ),
    ]);
  };
}
