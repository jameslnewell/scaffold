import * as fs from 'node:fs/promises';
import {type Content, DiskContent} from '../files/Content.js';
import type {Files} from '../files/Files.js';
import {concurrently} from '../files/concurrently.js';

// large enough to compare quickly, small enough that large files are never fully buffered
const CHUNK_SIZE = 64 * 1024;

export type Change =
  | {type: 'create'; content: Content}
  | {type: 'modify'; content: Content}
  | {type: 'delete'};

/**
 * The changes between two trees, keyed by path and sorted by path.
 *
 * @example
 * if (diff.has('package.json')) await npm.install()(ctx);
 */
export type Diff = ReadonlyMap<string, Change>;

/**
 * Compare two trees, typically the tree loaded from disk and the tree a scaffold produced.
 *
 * Files only in `after` are created, files only in `before` are deleted, and files in both are modified when
 * their contents differ. Files whose content is still the same object as in `before` are unchanged without being
 * read, so only the files a scaffold replaced are compared.
 *
 * @example
 * const before = await fromDisk(dir);
 * const after = await scaffold(before);
 * const changes = await diff(before, after);
 */
export async function diff(before: Files, after: Files): Promise<Diff> {
  const changes = new Map<string, Change>();

  const replaced: [string, Content][] = [];
  for (const [file, content] of after) {
    const previous = before.get(file);
    if (previous === undefined) {
      changes.set(file, {type: 'create', content});
    } else if (previous !== content) {
      replaced.push([file, content]);
    }
  }
  for (const file of before.paths()) {
    if (!after.has(file)) changes.set(file, {type: 'delete'});
  }

  await concurrently({
    items: replaced,
    task: async ([file, content]) => {
      const previous = before.get(file);
      if (previous === undefined) return;
      if (!(await isSameContent(previous, content))) {
        changes.set(file, {type: 'modify', content});
      }
    },
  });

  return new Map([...changes].sort(([a], [b]) => (a < b ? -1 : 1)));
}

async function sizeOf(content: Content): Promise<number> {
  if (content instanceof Uint8Array) return content.byteLength;
  return (await content.stat()).size;
}

async function isSameContent(a: Content, b: Content): Promise<boolean> {
  if (
    a instanceof DiskContent &&
    b instanceof DiskContent &&
    a.path === b.path
  ) {
    return true;
  }

  const size = await sizeOf(a);
  if (size !== (await sizeOf(b))) return false;

  if (a instanceof Uint8Array && b instanceof Uint8Array) {
    return Buffer.from(a.buffer, a.byteOffset, a.byteLength).equals(b);
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

async function openChunkReader(content: Content): Promise<ChunkReader> {
  if (content instanceof Uint8Array) {
    const bytes = Buffer.from(
      content.buffer,
      content.byteOffset,
      content.byteLength,
    );
    return {
      read: (offset, length) =>
        Promise.resolve(bytes.subarray(offset, offset + length)),
      close: () => Promise.resolve(),
    };
  }
  const handle = await fs.open(content.path);
  return {
    read: async (offset, length) => {
      const chunk = Buffer.alloc(length);
      const {bytesRead} = await handle.read(chunk, 0, length, offset);
      return chunk.subarray(0, bytesRead);
    },
    close: () => handle.close(),
  };
}
