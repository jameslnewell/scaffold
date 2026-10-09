import type {Files} from './Files.js';

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
