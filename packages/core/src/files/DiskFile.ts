import * as fs from 'node:fs/promises';
import type {File, FileStats} from './File.js';

/**
 * A file on disk which is only read when its bytes are needed. Reads and stats are cached, so every tree which
 * shares the file shares a single read.
 */
export class DiskFile implements File {
  /** The absolute path of the file on disk, so it can be copied without being read */
  readonly path: string;
  #bytes: Promise<Uint8Array> | undefined;
  #stat: Promise<FileStats> | undefined;

  constructor(path: string) {
    this.path = path;
  }

  bytes(): Promise<Uint8Array> {
    this.#bytes ??= fs.readFile(this.path);
    return this.#bytes;
  }

  stat(): Promise<FileStats> {
    this.#stat ??= fs.stat(this.path).then(({size, mode}) => ({size, mode}));
    return this.#stat;
  }
}
