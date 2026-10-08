import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {DiskContent} from './Content.js';
import {Files} from './Files.js';
import {toDisk} from './toDisk.js';

describe(toDisk, () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'buildscaffold-'));
  });

  afterEach(async () => {
    await fs.rm(dir, {recursive: true, force: true});
  });

  test('writes bytes and copies disk content, creating directories', async () => {
    const source = path.join(dir, 'source.txt');
    await fs.writeFile(source, 'from disk');
    const files = new Files([
      ['out/a/bytes.txt', new TextEncoder().encode('from memory')],
      ['out/b/copied.txt', new DiskContent(source)],
    ]);

    await toDisk(dir, files);

    await expect(
      fs.readFile(path.join(dir, 'out/a/bytes.txt'), 'utf8'),
    ).resolves.toBe('from memory');
    await expect(
      fs.readFile(path.join(dir, 'out/b/copied.txt'), 'utf8'),
    ).resolves.toBe('from disk');
  });
});
