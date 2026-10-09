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
 * files = writeText(files, 'greeting.txt', 'Hello!');
 * files = writeText(files, 'bin/greet.sh', '#!/bin/sh\necho Hello!\n', {mode: 0o755});
 */
export function writeText(
  files: Files,
  file: string,
  text: string,
  {mode}: WriteTextOptions = {},
): Files {
  const previous = files.get(file);
  return files.set(
    file,
    createFile({
      bytes: new TextEncoder().encode(text),
      mode:
        mode ??
        (previous === undefined
          ? DEFAULT_MODE
          : async () => (await previous.stat()).mode),
    }),
  );
}
