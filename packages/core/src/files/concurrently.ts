// enough to keep the disk busy without running out of file descriptors (EMFILE) on large trees
const DEFAULT_CONCURRENCY = 32;

interface ConcurrentlyOptions<T> {
  items: Iterable<T>;
  task: (item: T) => Promise<void>;
  concurrency?: number;
}

export async function concurrently<T>({
  items,
  task,
  concurrency = DEFAULT_CONCURRENCY,
}: ConcurrentlyOptions<T>): Promise<void> {
  const iterator = items[Symbol.iterator]();
  let failed = false;
  // each worker pulls the next item from the shared iterator until it is exhausted, and stops starting new items
  // once any item fails, so nothing more is written after the error is reported
  const worker = async (): Promise<void> => {
    for (
      let next = iterator.next();
      !next.done && !failed;
      next = iterator.next()
    ) {
      try {
        await task(next.value);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  };
  await Promise.all(Array.from({length: concurrency}, worker));
}
