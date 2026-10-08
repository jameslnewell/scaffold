import * as fs from 'node:fs/promises';

/**
 * A file on disk which is only read when its bytes are needed.
 *
 * Reads are cached, so every tree which shares this content shares a single read.
 */
export class DiskContent {
  /** The absolute path of the file on disk */
  readonly path: string;
  #read: Promise<Uint8Array> | undefined;
  #stat: Promise<{size: number}> | undefined;

  constructor(path: string) {
    this.path = path;
  }

  read(): Promise<Uint8Array> {
    this.#read ??= fs.readFile(this.path);
    return this.#read;
  }

  stat(): Promise<{size: number}> {
    this.#stat ??= fs.stat(this.path);
    return this.#stat;
  }
}

/**
 * The content of a file, either bytes in memory or a reference to a file on disk.
 */
export type Content = Uint8Array | DiskContent;
