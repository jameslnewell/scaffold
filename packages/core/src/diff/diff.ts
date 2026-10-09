import * as fs from 'node:fs/promises';
import {DiskFile} from '../files/DiskFile.js';
import type {File} from '../files/File.js';
import type {Files} from '../files/Files.js';
import {concurrently} from '../files/concurrently.js';
import {modeOf} from '../files/modeOf.js';

// large enough to compare quickly, small enough that large files are never fully buffered
const CHUNK_SIZE = 64 * 1024;

export type Change =
  | {type: 'create'; file: File}
  | {type: 'modify'; file: File}
  | {type: 'delete'};

/**
 * The changes between two trees, keyed by path and sorted by path.
 *
 * @example
 * if (changes.has('package.json')) console.log('package.json changed');
 */
export type Diff = ReadonlyMap<string, Change>;

/**
 * Compare two trees, typically the tree loaded from disk and the tree a scaffold produced.
 *
 * Files only in `after` are created, files only in `before` are deleted, and files in both are modified when
 * their bytes or modes differ. A file without a mode keeps the mode it has, so isn't modified by its mode. Modes
 * are ignored on Windows. Files which are still the same object as in `before` are unchanged without being read,
 * so only the files a scaffold replaced are compared.
 *
 * @example
 * const before = await fromDisk(dir);
 * const after = await scaffold(before);
 * const changes = await diff(before, after);
 */
export async function diff(before: Files, after: Files): Promise<Diff> {
  const changes = new Map<string, Change>();

  const replaced: [string, File][] = [];
  for (const [file, value] of after) {
    const previous = before.get(file);
    if (previous === undefined) {
      changes.set(file, {type: 'create', file: value});
    } else if (previous !== value) {
      replaced.push([file, value]);
    }
  }
  for (const file of before.keys()) {
    if (!after.has(file)) changes.set(file, {type: 'delete'});
  }

  await concurrently({
    items: replaced,
    task: async ([file, value]) => {
      const previous = before.get(file);
      if (previous === undefined) return;
      const [previousSize, size] = await Promise.all([
        sizeOf(previous),
        sizeOf(value),
      ]);
      const isSame =
        (await isSameMode(previous, value)) &&
        previousSize === size &&
        (await isSameBytes({a: previous, b: value, size}));
      if (!isSame) {
        changes.set(file, {type: 'modify', file: value});
      }
    },
  });

  return new Map([...changes].sort(([a], [b]) => (a < b ? -1 : 1)));
}

// files on disk are measured without being read, while the size of any other file is taken from its bytes, so a
// size which doesn't match its bytes can't hide a change
async function sizeOf(file: File): Promise<number> {
  return file instanceof DiskFile
    ? (await file.stat()).size
    : (await file.bytes()).byteLength;
}

// a file without a mode keeps the mode it has. Modes aren't applied on Windows, which only has a read-only flag, so
// they can't differ there.
async function isSameMode(before: File, after: File): Promise<boolean> {
  if (process.platform === 'win32') return true;
  const [previous, mode] = await Promise.all([modeOf(before), modeOf(after)]);
  if (mode === undefined || previous === undefined) return true;
  return (mode & 0o7777) === (previous & 0o7777);
}

interface IsSameBytesOptions {
  a: File;
  b: File;
  size: number;
}

async function isSameBytes({a, b, size}: IsSameBytesOptions): Promise<boolean> {
  if (a instanceof DiskFile && b instanceof DiskFile && a.path === b.path) {
    return true;
  }

  const readerA = await openChunkReader(a);
  try {
    const readerB = await openChunkReader(b);
    try {
      for (let offset = 0; offset < size; offset += CHUNK_SIZE) {
        const length = Math.min(CHUNK_SIZE, size - offset);
        const [chunkA, chunkB] = await Promise.all([
          readerA.read(offset, length),
          readerB.read(offset, length),
        ]);
        if (!chunkA.equals(chunkB)) return false;
      }
      return true;
    } finally {
      await readerB.close();
    }
  } finally {
    await readerA.close();
  }
}

interface ChunkReader {
  read(offset: number, length: number): Promise<Buffer>;
  close(): Promise<void>;
}

// a file on disk is compared in chunks through a file handle, so a large file is never fully read into memory
async function openChunkReader(file: File): Promise<ChunkReader> {
  if (!(file instanceof DiskFile)) {
    const bytes = await file.bytes();
    const buffer = Buffer.from(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    );
    return {
      read: (offset, length) =>
        Promise.resolve(buffer.subarray(offset, offset + length)),
      close: () => Promise.resolve(),
    };
  }
  const handle = await fs.open(file.path);
  return {
    read: async (offset, length) => {
      const chunk = Buffer.alloc(length);
      const {bytesRead} = await handle.read(chunk, 0, length, offset);
      return chunk.subarray(0, bytesRead);
    },
    close: () => handle.close(),
  };
}
