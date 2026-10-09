export interface FileStats {
  /** The size in bytes */
  size: number;
  /** The file mode e.g. `0o755`, or `undefined` to use the default for a new file and keep the mode of an existing one */
  mode?: number | undefined;
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
