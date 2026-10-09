import {DEFAULT_MODE, createFile} from './File.js';
import type {Files} from './Files.js';

export interface WriteTextOptions {
  /**
   * The file mode e.g. `0o755` for an executable. Without one, a new file gets the default mode, `0o644`, and a file
   * which replaces another keeps its mode.
   */
  mode?: number | undefined;
}

/**
 * A new tree with the file at the path replaced by UTF-8 text.
 *
 * This is the only way to set a file's mode. Without one, a new file gets the default mode, `0o644`, and a file
 * which replaces another keeps its mode.
 *
 * @example
 * files = await writeText(files, 'greeting.txt', 'Hello!');
 * files = await writeText(files, 'bin/greet.sh', '#!/bin/sh\necho Hello!\n', {mode: 0o755});
 */
export async function writeText(
  files: Files,
  file: string,
  text: string,
  {mode}: WriteTextOptions = {},
): Promise<Files> {
  const previous = files.get(file);
  return files.set(
    file,
    createFile({
      bytes: new TextEncoder().encode(text),
      mode: mode ?? (previous ? (await previous.stat()).mode : DEFAULT_MODE),
    }),
  );
}
