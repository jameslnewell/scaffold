import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {createFilesFromDisk as fromDisk} from './createFilesFromDisk.js';
import {pathToFileURL} from 'node:url';
import {readText} from './readText.js';

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
    expect([...files.keys()]).toEqual([
      '.env',
      '.github/workflows/ci.yml',
      'README.md',
      'src/index.test.ts',
      'src/index.ts',
    ]);
  });

  test('loads only files matching the glob', async () => {
    const files = await fromDisk(dir, {glob: '**/*.{yml,ts}'});
    expect([...files.keys()]).toEqual([
      '.github/workflows/ci.yml',
      'src/index.test.ts',
      'src/index.ts',
    ]);
  });

  test('skips files matching the ignore globs', async () => {
    const files = await fromDisk(dir, {
      ignore: ['src/*.test.ts', '.github/**'],
    });
    expect([...files.keys()]).toEqual([
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
    expect([...files.keys()]).toEqual(['README.md']);
  });

  test('loads a directory which does not exist as an empty tree', async () => {
    const files = await fromDisk(path.join(dir, 'missing'));
    expect(files.size).toBe(0);
  });

  test('reads files when they are needed, and only once', async () => {
    const files = await fromDisk(dir);
    // a file is read when it's needed, so a change made after loading is seen
    await fs.writeFile(path.join(dir, 'README.md'), '# Changed');
    await expect(readText(files, 'README.md')).resolves.toBe('# Changed');
    // and the read is cached, so a later change isn't
    await fs.writeFile(path.join(dir, 'README.md'), '# Changed again');
    await expect(readText(files, 'README.md')).resolves.toBe('# Changed');
  });

  test('reports the size and mode of a file', async () => {
    const files = await fromDisk(dir);
    const stats = await fs.stat(path.join(dir, 'README.md'));
    await expect(files.get('README.md')?.stat()).resolves.toEqual({
      size: stats.size,
      mode: stats.mode,
    });
  });
});
