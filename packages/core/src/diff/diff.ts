import * as fs from 'node:fs/promises';
import {
  type Content,
  isLazyContent,
  modeOf,
  pathOf,
  sizeOf,
} from '../files/Content.js';
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
 * if (changes.has('package.json')) console.log('package.json changed');
 */
export type Diff = ReadonlyMap<string, Change>;

/**
 * Compare two trees, typically the tree loaded from disk and the tree a scaffold produced.
 *
 * Files only in `after` are created, files only in `before` are deleted, and files in both are modified when
 * their contents or modes differ. A file without a mode keeps the mode it has, so isn't modified by its mode. Modes
 * are ignored on Windows. Files whose content is still the same object as in `before` are unchanged without being
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
      const isSame =
        (await isSameMode(previous, content)) &&
        (await isSameContent(previous, content));
      if (!isSame) {
        changes.set(file, {type: 'modify', content});
      }
    },
  });

  return new Map([...changes].sort(([a], [b]) => (a < b ? -1 : 1)));
}

async function isSameMode(before: Content, after: Content): Promise<boolean> {
  // modes aren't applied on Windows, which only has a read-only flag, so they can't differ there
  if (process.platform === 'win32') return true;
  const mode = await modeOf(after);
  if (mode === undefined) return true;
  const previous = await modeOf(before);
  if (previous === undefined) return true;
  return (mode & 0o7777) === (previous & 0o7777);
}

async function isSameContent(a: Content, b: Content): Promise<boolean> {
  const pathA = pathOf(a);
  if (pathA !== undefined && pathA === pathOf(b)) return true;

  const size = await sizeOf(a);
  if (size !== (await sizeOf(b))) return false;

  if (!isLazyContent(a) && !isLazyContent(b)) {
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
  const file = pathOf(content);
  if (file === undefined) {
    const bytes = isLazyContent(content) ? await content.read() : content;
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
  const handle = await fs.open(file);
  return {
    read: async (offset, length) => {
      const chunk = Buffer.alloc(length);
      const {bytesRead} = await handle.read(chunk, 0, length, offset);
      return chunk.subarray(0, bytesRead);
    },
    close: () => handle.close(),
  };
}
