import * as path from 'node:path';
import {type Content, isLazyContent, withMode} from './Content.js';

function normalize(file: string): string {
  if (path.posix.isAbsolute(file) || path.win32.isAbsolute(file)) {
    throw new Error(`Expected a relative path but received "${file}"`);
  }
  const normalized = path.posix.normalize(file);
  if (normalized === '..' || normalized.startsWith('../')) {
    throw new Error(`Expected a path inside the tree but received "${file}"`);
  }
  if (normalized === '.' || normalized.endsWith('/')) {
    throw new Error(`Expected a path to a file but received "${file}"`);
  }
  return normalized;
}

export interface WriteOptions {
  /** The file mode e.g. `0o755` for an executable */
  mode?: number | undefined;
}

/**
 * An immutable tree of files, keyed by relative POSIX paths e.g. `src/index.ts`.
 *
 * Every change returns a new tree. Content is shared by reference, so copying files is cheap and files which
 * were loaded from disk aren't read until they're needed.
 *
 * @example
 * const files = new Files().write('greeting.txt', new TextEncoder().encode('Hello!'));
 * files.has('greeting.txt'); // true
 */
export class Files implements Iterable<[string, Content]> {
  #entries: ReadonlyMap<string, Content>;

  constructor(entries: Iterable<readonly [string, Content]> = []) {
    const normalized = new Map<string, Content>();
    for (const [file, content] of entries) {
      normalized.set(normalize(file), content);
    }
    this.#entries = normalized;
  }

  /** The number of files in the tree */
  get size(): number {
    return this.#entries.size;
  }

  /** Whether the tree contains a file at the path */
  has(file: string): boolean {
    return this.#entries.has(normalize(file));
  }

  /** The content of the file at the path, without reading it */
  get(file: string): Content | undefined {
    return this.#entries.get(normalize(file));
  }

  /** The bytes of the file at the path, or `undefined` when there is no file */
  async read(file: string): Promise<Uint8Array | undefined> {
    const content = this.get(file);
    if (content === undefined || !isLazyContent(content)) return content;
    return content.read();
  }

  /**
   * A new tree with the file at the path replaced. A file written without a `mode` gets the default mode when it's
   * created, and keeps its mode when it already exists on disk.
   */
  write(file: string, content: Content, {mode}: WriteOptions = {}): Files {
    const entries = new Map(this.#entries);
    entries.set(
      normalize(file),
      mode === undefined ? content : withMode(content, mode),
    );
    return Files.#from(entries);
  }

  /** A new tree without the file at the path */
  remove(file: string): Files {
    const entries = new Map(this.#entries);
    entries.delete(normalize(file));
    return Files.#from(entries);
  }

  // skips normalising the paths again, which would make each change to a large tree much slower
  static #from(entries: ReadonlyMap<string, Content>): Files {
    const files = new Files();
    files.#entries = entries;
    return files;
  }

  /** The paths of every file in the tree, sorted */
  paths(): string[] {
    return [...this.#entries.keys()].sort();
  }

  /** Iterates over each `[path, content]` in the tree, sorted by path */
  *[Symbol.iterator](): Iterator<[string, Content]> {
    for (const file of this.paths()) {
      const content = this.#entries.get(file);
      if (content !== undefined) yield [file, content];
    }
  }
}
