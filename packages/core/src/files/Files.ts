import * as path from 'node:path';
import type {File} from './File.js';

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

/**
 * An immutable tree of files, keyed by relative POSIX paths e.g. `src/index.ts`. It works like a `Map`, except
 * `set` and `delete` return a new tree.
 *
 * Files are shared by reference, so copying a file is cheap, and files loaded from disk aren't read until they're
 * needed. Use `readText` and `writeText` to read and write text, or `get(path)?.bytes()` to read bytes.
 *
 * @example
 * let files = writeText(new Files(), 'greeting.txt', 'Hello!');
 * const greeting = files.get('greeting.txt');
 * if (greeting) files = files.set('copy.txt', greeting);
 * files.has('copy.txt'); // true
 */
export class Files implements Iterable<[string, File]> {
  #entries: ReadonlyMap<string, File>;

  constructor(entries: Iterable<readonly [string, File]> = []) {
    const normalized = new Map<string, File>();
    for (const [file, value] of entries) {
      normalized.set(normalize(file), value);
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

  /** The file at the path, without reading it, or `undefined` when there is none */
  get(file: string): File | undefined {
    return this.#entries.get(normalize(file));
  }

  /** A new tree with the file at the path replaced */
  set(file: string, value: File): Files {
    const entries = new Map(this.#entries);
    entries.set(normalize(file), value);
    return Files.#from(entries);
  }

  /** A new tree without the file at the path */
  delete(file: string): Files {
    const entries = new Map(this.#entries);
    entries.delete(normalize(file));
    return Files.#from(entries);
  }

  // skips normalising the paths again, which would make each change to a large tree much slower
  static #from(entries: ReadonlyMap<string, File>): Files {
    const files = new Files();
    files.#entries = entries;
    return files;
  }

  /** The paths of the files in the tree, sorted */
  keys(): IterableIterator<string> {
    return [...this.#entries.keys()].sort()[Symbol.iterator]();
  }

  /** The files in the tree, sorted by path */
  *values(): IterableIterator<File> {
    for (const [, value] of this.entries()) yield value;
  }

  /** Each `[path, file]` in the tree, sorted by path */
  *entries(): IterableIterator<[string, File]> {
    for (const file of this.keys()) {
      const value = this.#entries.get(file);
      if (value !== undefined) yield [file, value];
    }
  }

  /** Each `[path, file]` in the tree, sorted by path */
  [Symbol.iterator](): IterableIterator<[string, File]> {
    return this.entries();
  }
}
