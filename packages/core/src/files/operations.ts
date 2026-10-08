import * as path from 'node:path';
import {type MatchOptions, match} from './match.js';
import type {Content} from './Content.js';
import {Files} from './Files.js';

export type CopyOptions = MatchOptions;

interface DestinationsOptions {
  files: Files;
  from: string;
  to: string;
  options: MatchOptions;
}

function destinations({files, from, to, options}: DestinationsOptions): Array<{
  source: string;
  destination: string;
  content: Content;
}> {
  return match(files, from, options).map(({file, relative}) => {
    const content = files.get(file);
    if (content === undefined) throw new Error(`File "${file}" is missing`);
    return {
      source: file,
      destination: relative === undefined ? to : path.posix.join(to, relative),
      content,
    };
  });
}

/**
 * A new tree with a file, the files in a directory, or the files matching a glob copied to another path.
 *
 * A file is copied to the `to` path, while a directory or glob is copied into the `to` directory, keeping paths relative to the directory or to the
 * glob's base e.g. `src/a/b.txt` is copied to `dest/a/b.txt` by `copy(files, 'src/**', 'dest')`. Throws when
 * nothing matches.
 *
 * @example
 * files = copy(files, 'templates/**', '.', {ignore: ['**\/*.md']});
 */
export function copy(
  files: Files,
  from: string,
  to: string,
  options: CopyOptions = {},
): Files {
  const copies = destinations({files, from, to, options});
  return new Files([
    ...files,
    ...copies.map(({destination, content}) => [destination, content] as const),
  ]);
}

export type MoveOptions = MatchOptions;

/**
 * A new tree with a file, the files in a directory, or the files matching a glob moved to another path.
 *
 * Paths are mapped the same way as `copy`. Throws when nothing matches.
 *
 * @example
 * files = move(files, 'gitignore', '.gitignore');
 */
export function move(
  files: Files,
  from: string,
  to: string,
  options: MoveOptions = {},
): Files {
  const moves = destinations({files, from, to, options});
  const sources = new Set(moves.map(({source}) => source));
  return new Files([
    ...[...files].filter(([file]) => !sources.has(file)),
    ...moves.map(({destination, content}) => [destination, content] as const),
  ]);
}

export type RemoveOptions = MatchOptions;

/**
 * A new tree without a file, the files in a directory, or the files matching a glob. Throws when nothing matches.
 *
 * @example
 * files = remove(files, 'src/**\/*.test.ts');
 */
export function remove(
  files: Files,
  from: string,
  options: RemoveOptions = {},
): Files {
  const removed = new Set(match(files, from, options).map(({file}) => file));
  return new Files([...files].filter(([file]) => !removed.has(file)));
}
