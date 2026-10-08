import type {Files} from './Files.js';

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
 * A new tree with the file replaced by UTF-8 text.
 *
 * @example
 * files = writeText(files, 'greeting.txt', 'Hello!');
 */
export function writeText(files: Files, file: string, text: string): Files {
  return files.write(file, new TextEncoder().encode(text));
}
