export interface ContentStats {
  /** The size in bytes */
  size: number;
  /** The file mode e.g. `0o755`, or `undefined` to use the default for a new file and keep the mode of an existing one */
  mode?: number | undefined;
}

/**
 * Content which is loaded when it's needed rather than held in memory, e.g. a file on disk.
 *
 * Implementations should cache their reads, so every tree which shares the content shares a single read.
 */
export interface LazyContent {
  read(): Promise<Uint8Array>;
  stat(): Promise<ContentStats>;
  /** The absolute path of a file on disk which holds the content, so it can be copied without being read */
  readonly path?: string | undefined;
}

/**
 * The content of a file, either bytes in memory or content which is loaded when it's needed.
 */
export type Content = Uint8Array | LazyContent;

/**
 * Whether the content is loaded when it's needed, rather than bytes in memory.
 *
 * @example
 * const size = isLazyContent(content) ? (await content.stat()).size : content.byteLength;
 */
export function isLazyContent(content: Content): content is LazyContent {
  return 'read' in content && typeof content.read === 'function';
}

/** The size of the content in bytes, without reading lazy content */
export async function sizeOf(content: Content): Promise<number> {
  return isLazyContent(content)
    ? (await content.stat()).size
    : content.byteLength;
}

/** The mode of the content, or `undefined` when it has none */
export async function modeOf(content: Content): Promise<number | undefined> {
  return isLazyContent(content) ? (await content.stat()).mode : undefined;
}

/** The path of the file on disk which holds the content, or `undefined` when there is none */
export function pathOf(content: Content): string | undefined {
  return isLazyContent(content) ? content.path : undefined;
}

/** The content with its mode replaced, sharing the bytes and any cached reads */
export function withMode(content: Content, mode: number): LazyContent {
  if (!isLazyContent(content)) {
    return {
      read: () => Promise.resolve(content),
      stat: () => Promise.resolve({size: content.byteLength, mode}),
    };
  }
  return {
    read: () => content.read(),
    stat: async () => ({...(await content.stat()), mode}),
    path: content.path,
  };
}
