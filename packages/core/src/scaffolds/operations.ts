import * as files from '../files/index.js';
import type {Scaffold} from './Scaffold.js';

/**
 * A scaffold which writes a file as UTF-8 text.
 *
 * An existing file is replaced. Without a `mode`, a new file gets the default mode and an existing file keeps its
 * mode on disk.
 *
 * @example
 * write('greeting.txt', 'Hello!')
 * write('bin/greet.sh', '#!/bin/sh\necho Hello!\n', {mode: 0o755})
 */
export function write(
  file: string,
  text: string,
  options: files.WriteTextOptions = {},
): Scaffold {
  return (tree) => files.writeText(tree, file, text, options);
}

/**
 * A scaffold which copies a file, the files in a directory, or the files matching a glob.
 *
 * Files already at the destination are replaced, and the copies keep the sources' modes. Throws when nothing
 * matches.
 *
 * @see the `copy` operation in `@buildscaffold/core/files`
 * @example
 * copy('templates/**', '.')
 */
export function copy(
  from: string,
  to: string,
  options: files.CopyOptions = {},
): Scaffold {
  return (tree) => files.copy(tree, from, to, options);
}

/**
 * A scaffold which moves a file, the files in a directory, or the files matching a glob.
 *
 * Files already at the destination are replaced, and the moved files keep their modes. Throws when nothing
 * matches.
 *
 * @see the `move` operation in `@buildscaffold/core/files`
 * @example
 * move('gitignore', '.gitignore')
 */
export function move(
  from: string,
  to: string,
  options: files.MoveOptions = {},
): Scaffold {
  return (tree) => files.move(tree, from, to, options);
}

/**
 * A scaffold which removes a file, the files in a directory, or the files matching a glob. Throws when nothing
 * matches.
 *
 * @see the `remove` operation in `@buildscaffold/core/files`
 * @example
 * remove('src/**\/*.test.ts')
 */
export function remove(
  from: string,
  options: files.RemoveOptions = {},
): Scaffold {
  return (tree) => files.remove(tree, from, options);
}
