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
  const bytes = new TextEncoder().encode(text);
  const previous = files.get(file);
  if (mode !== undefined || previous === undefined) {
    return files.set(file, createFile({bytes, mode: mode ?? DEFAULT_MODE}));
  }
  // the file being replaced may not have been stat-ed yet, so its mode is only looked up when it's needed
  return files.set(file, {
    bytes: () => Promise.resolve(bytes),
    stat: async () => ({
      size: bytes.byteLength,
      mode: (await previous.stat()).mode,
    }),
  });
}
