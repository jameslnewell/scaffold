import type {File, FileStats} from './File.js';

interface MemoryFileOptions {
  bytes: Uint8Array;
  /** Without one, a new file gets the default mode and an existing file keeps its mode on disk */
  mode: number | undefined;
}

/**
 * A file whose bytes are in memory.
 */
export class MemoryFile implements File {
  readonly #bytes: Uint8Array;
  readonly #mode: number | undefined;

  constructor({bytes, mode}: MemoryFileOptions) {
    this.#bytes = bytes;
    this.#mode = mode;
  }

  bytes(): Promise<Uint8Array> {
    return Promise.resolve(this.#bytes);
  }

  stat(): Promise<FileStats> {
    return Promise.resolve({size: this.#bytes.byteLength, mode: this.#mode});
  }
}
