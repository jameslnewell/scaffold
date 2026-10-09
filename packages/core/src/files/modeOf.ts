import {DiskFile} from './DiskFile.js';
import type {File} from './File.js';
import {MemoryFile} from './MemoryFile.js';

/**
 * The mode of a file loaded from disk or written by `writeText`. Other implementations of `File` can't set a mode,
 * since `writeText` is the only way to set one.
 */
export async function modeOf(file: File): Promise<number | undefined> {
  if (file instanceof DiskFile || file instanceof MemoryFile) {
    return (await file.stat()).mode;
  }
  return undefined;
}
