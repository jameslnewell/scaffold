import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {DiskContent} from './DiskContent.js';
import {fromDisk} from './fromDisk.js';
import {pathToFileURL} from 'node:url';
import {readText} from './text.js';

describe(fromDisk, () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'buildscaffold-'));
    const files = {
      'README.md': '# Readme',
      '.env': 'SECRET=1',
      '.github/workflows/ci.yml': 'name: CI',
      'src/index.ts': 'export {};',
      'src/index.test.ts': 'test();',
      '.git/HEAD': 'ref: refs/heads/main',
      'node_modules/pkg/index.js': '',
      'packages/a/node_modules/pkg/index.js': '',
    };
    for (const [file, text] of Object.entries(files)) {
      await fs.mkdir(path.dirname(path.join(dir, file)), {recursive: true});
      await fs.writeFile(path.join(dir, file), text);
    }
  });

  afterEach(async () => {
    await fs.rm(dir, {recursive: true, force: true});
  });

  test('loads files and dotfiles, ignoring .git and node_modules anywhere by default', async () => {
    const files = await fromDisk(dir);
    expect(files.paths()).toEqual([
      '.env',
      '.github/workflows/ci.yml',
      'README.md',
      'src/index.test.ts',
      'src/index.ts',
    ]);
  });

  test('loads only files matching the glob', async () => {
    const files = await fromDisk(dir, {glob: '**/*.{yml,ts}'});
    expect(files.paths()).toEqual([
      '.github/workflows/ci.yml',
      'src/index.test.ts',
      'src/index.ts',
    ]);
  });

  test('skips files matching the ignore globs', async () => {
    const files = await fromDisk(dir, {
      ignore: ['src/*.test.ts', '.github/**'],
    });
    expect(files.paths()).toEqual([
      '.env',
      '.git/HEAD',
      'README.md',
      'node_modules/pkg/index.js',
      'packages/a/node_modules/pkg/index.js',
      'src/index.ts',
    ]);
  });

  test('loads a directory given as a URL', async () => {
    const files = await fromDisk(pathToFileURL(dir), {glob: 'README.md'});
    expect(files.paths()).toEqual(['README.md']);
  });

  test('loads a directory which does not exist as an empty tree', async () => {
    const files = await fromDisk(path.join(dir, 'missing'));
    expect(files.size).toBe(0);
  });

  test('reads contents lazily and only once', async () => {
    const read = vi.spyOn(DiskContent.prototype, 'read');
    const files = await fromDisk(dir);
    expect(read).not.toHaveBeenCalled();
    await expect(readText(files, 'README.md')).resolves.toBe('# Readme');
    await readText(files, 'README.md');
    expect(read).toHaveBeenCalledTimes(2);
    expect(read.mock.results[0]?.value).toBe(read.mock.results[1]?.value);
  });
});
