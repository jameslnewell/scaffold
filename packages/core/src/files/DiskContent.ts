import * as fs from 'node:fs/promises';
import type {ContentStats, LazyContent} from './Content.js';

/**
 * A file on disk which is only read when its bytes are needed.
 */
export class DiskContent implements LazyContent {
  readonly path: string;
  #read: Promise<Uint8Array> | undefined;
  #stat: Promise<ContentStats> | undefined;

  constructor(path: string) {
    this.path = path;
  }

  read(): Promise<Uint8Array> {
    this.#read ??= fs.readFile(this.path);
    return this.#read;
  }

  stat(): Promise<ContentStats> {
    this.#stat ??= fs.stat(this.path).then(({size, mode}) => ({size, mode}));
    return this.#stat;
  }
}
