import type {Files} from './Files.js';
import {MemoryFile} from './MemoryFile.js';

/**
 * The file at the path as UTF-8 text, or `undefined` when there is no file.
 *
 * @example
 * const readme = await readText(files, 'README.md');
 */
export async function readText(
  files: Files,
  file: string,
): Promise<string | undefined> {
  const bytes = await files.get(file)?.bytes();
  return bytes === undefined ? undefined : new TextDecoder().decode(bytes);
}

export interface WriteTextOptions {
  /**
   * The file mode e.g. `0o755` for an executable. Without one, a new file gets the default mode and an existing
   * file keeps its mode on disk.
   */
  mode?: number | undefined;
}

/**
 * A new tree with the file at the path replaced by UTF-8 text.
 *
 * This is the only way to set a file's mode. Without one, a new file gets the default mode and an existing file
 * keeps its mode on disk.
 *
 * @example
 * files = writeText(files, 'greeting.txt', 'Hello!');
 * files = writeText(files, 'bin/greet.sh', '#!/bin/sh\necho Hello!\n', {mode: 0o755});
 */
export function writeText(
  files: Files,
  file: string,
  text: string,
  {mode}: WriteTextOptions = {},
): Files {
  return files.set(
    file,
    new MemoryFile({bytes: new TextEncoder().encode(text), mode}),
  );
}
