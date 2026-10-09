import * as fs from 'node:fs/promises';

export interface FileStats {
  /** The size in bytes */
  size: number;
  /** The file mode e.g. `0o755` */
  mode: number;
}

/**
 * A file in a tree. Its bytes may already be in memory, or only be read when they're needed, e.g. from disk.
 *
 * Implementations should cache their reads, so every tree which shares the file shares a single read.
 *
 * @example
 * const bytes = await file.bytes();
 * const {size, mode} = await file.stat();
 */
export interface File {
  bytes(): Promise<Uint8Array>;
  stat(): Promise<FileStats>;
}

/** The mode of a new file, which is the usual mode for a file created with the default umask */
export const DEFAULT_MODE = 0o644;

interface CreateFileOptions {
  bytes: Uint8Array;
  /** The mode, or a function which resolves it when it's needed e.g. from the file being replaced */
  mode: number | (() => Promise<number>);
}

/**
 * A file whose bytes are in memory.
 */
export function createFile({bytes, mode}: CreateFileOptions): File {
  let resolvedMode: Promise<number> | undefined;
  return {
    bytes: () => Promise.resolve(bytes),
    stat: async () => {
      resolvedMode ??=
        typeof mode === 'number' ? Promise.resolve(mode) : mode();
      return {size: bytes.byteLength, mode: await resolvedMode};
    },
  };
}

/**
 * A file on disk which is only read when its bytes are needed. Reads and stats are cached, so every tree which
 * shares the file shares a single read.
 */
export function createFileFromDisk(path: string): File {
  let bytes: Promise<Uint8Array> | undefined;
  let stat: Promise<FileStats> | undefined;
  return {
    bytes: () => {
      bytes ??= fs.readFile(path);
      return bytes;
    },
    stat: () => {
      stat ??= fs.stat(path).then(({size, mode}) => ({size, mode}));
      return stat;
    },
  };
}
