import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {Content} from './Content.js';
import {concurrently} from './concurrently.js';

interface WriteEntriesOptions {
  dir: string;
  entries: Iterable<readonly [string, Content]>;
}

export async function writeEntries({
  dir,
  entries,
}: WriteEntriesOptions): Promise<void> {
  const files = [...entries];

  const directories = new Set(
    files.map(([file]) => path.dirname(path.join(dir, file))),
  );
  await concurrently({
    items: directories,
    task: async (directory) => {
      await fs.mkdir(directory, {recursive: true});
    },
  });

  await concurrently({
    items: files,
    task: async ([file, content]) => {
      const destination = path.join(dir, file);
      if (content instanceof Uint8Array) {
        await fs.writeFile(destination, content);
      } else {
        // copies natively (or clones where the filesystem supports it) so the bytes never pass through JS
        await fs.copyFile(
          content.path,
          destination,
          fs.constants.COPYFILE_FICLONE,
        );
      }
    },
  });
}
