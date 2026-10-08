import type {Files, WriteOptions} from './Files.js';

/**
 * Read a file as UTF-8 text, or `undefined` when there is no file.
 *
 * @example
 * const readme = await readText(files, 'README.md');
 */
export async function readText(
  files: Files,
  file: string,
): Promise<string | undefined> {
  const bytes = await files.read(file);
  return bytes === undefined ? undefined : new TextDecoder().decode(bytes);
}

/**
 * A new tree with the file replaced by UTF-8 text. A file written without a `mode` gets the default mode when it's
 * created, and keeps its mode when it already exists on disk.
 *
 * @example
 * files = writeText(files, 'greeting.txt', 'Hello!');
 * files = writeText(files, 'bin/greet.sh', '#!/bin/sh\necho Hello!\n', {mode: 0o755});
 */
export function writeText(
  files: Files,
  file: string,
  text: string,
  options: WriteOptions = {},
): Files {
  return files.write(file, new TextEncoder().encode(text), options);
}
