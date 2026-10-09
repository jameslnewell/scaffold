import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {apply, diff} from '../diff/index.js';
import {copy, move, remove} from './operations.js';
import {readText, writeText} from './contents.js';
import {Files} from './Files.js';
import {fromDisk} from './fromDisk.js';

function tree(paths: string[]): Files {
  return paths.reduce(
    (files, file) => writeText(files, file, file),
    new Files(),
  );
}

describe(copy, () => {
  test('copies a file to a path', async () => {
    const files = copy(tree(['src/a.txt']), 'src/a.txt', 'dest/b.txt');
    expect([...files.keys()]).toEqual(['dest/b.txt', 'src/a.txt']);
    await expect(readText(files, 'dest/b.txt')).resolves.toBe('src/a.txt');
  });

  test('copies the files in a directory into another directory', () => {
    const files = copy(
      tree(['src/a.txt', 'src/b/c.txt', 'other.txt']),
      'src',
      'dest',
    );
    expect([...files.keys()]).toEqual([
      'dest/a.txt',
      'dest/b/c.txt',
      'other.txt',
      'src/a.txt',
      'src/b/c.txt',
    ]);
  });

  test('copies the files matching a glob relative to its base', () => {
    const files = copy(
      tree(['src/a.txt', 'src/b/c.txt', 'src/d.md']),
      'src/**/*.txt',
      'dest',
    );
    expect([...files.keys()]).toEqual([
      'dest/a.txt',
      'dest/b/c.txt',
      'src/a.txt',
      'src/b/c.txt',
      'src/d.md',
    ]);
  });

  test('skips ignored files', () => {
    const files = copy(tree(['src/a.txt', 'src/b.txt']), 'src', 'dest', {
      ignore: ['src/b.txt'],
    });
    expect([...files.keys()]).toEqual(['dest/a.txt', 'src/a.txt', 'src/b.txt']);
  });

  test('copies a file whose name contains glob characters', () => {
    const files = copy(tree(['[id].tsx']), '[id].tsx', 'copy.tsx');
    expect([...files.keys()]).toEqual(['[id].tsx', 'copy.tsx']);
  });

  test('shares content rather than copying it', () => {
    const files = copy(tree(['a.txt']), 'a.txt', 'b.txt');
    expect(files.get('b.txt')).toBe(files.get('a.txt'));
  });

  test('copies the whole tree', () => {
    const files = copy(tree(['a.txt', 'b/c.txt']), '.', 'dest');
    expect([...files.keys()]).toEqual([
      'a.txt',
      'b/c.txt',
      'dest/a.txt',
      'dest/b/c.txt',
    ]);
  });

  test('copies a directory given with a trailing slash', () => {
    const files = copy(tree(['src/a.txt']), 'src/', 'dest');
    expect([...files.keys()]).toEqual(['dest/a.txt', 'src/a.txt']);
  });

  test('copies a directory whose name contains glob characters', () => {
    const files = copy(tree(['app/(auth)/page.tsx']), 'app/(auth)', 'dest');
    expect([...files.keys()]).toEqual(['app/(auth)/page.tsx', 'dest/page.tsx']);
  });

  test('copies dotfiles matching a glob', () => {
    const files = copy(
      tree(['templates/.gitignore', 'templates/a.txt']),
      './templates/**',
      '.',
    );
    expect([...files.keys()]).toEqual([
      '.gitignore',
      'a.txt',
      'templates/.gitignore',
      'templates/a.txt',
    ]);
  });

  test('throws when nothing matches', () => {
    expect(() => copy(tree(['a.txt']), 'missing', 'dest')).toThrow(
      'No files matched "missing"',
    );
  });
});

describe(move, () => {
  test('moves a file to a path', () => {
    const files = move(tree(['gitignore']), 'gitignore', '.gitignore');
    expect([...files.keys()]).toEqual(['.gitignore']);
  });

  test('moves the files in a directory into a directory inside it', () => {
    const files = move(tree(['src/a.txt', 'src/b.txt']), 'src', 'src/nested');
    expect([...files.keys()]).toEqual(['src/nested/a.txt', 'src/nested/b.txt']);
  });

  test('moves the files matching a glob', () => {
    const files = move(tree(['src/a.txt', 'src/b.md']), 'src/*.txt', 'dest');
    expect([...files.keys()]).toEqual(['dest/a.txt', 'src/b.md']);
  });

  describe('when applied', () => {
    let dir: string;

    beforeEach(async () => {
      dir = await fs.mkdtemp(path.join(os.tmpdir(), 'buildscaffold-'));
    });

    afterEach(async () => {
      await fs.rm(dir, {recursive: true, force: true});
    });

    test('swaps two files within the destination', async () => {
      await fs.writeFile(path.join(dir, 'a.txt'), 'a');
      await fs.writeFile(path.join(dir, 'b.txt'), 'b');
      const before = await fromDisk(dir);
      let after = move(before, 'a.txt', 'tmp.txt');
      after = move(after, 'b.txt', 'a.txt');
      after = move(after, 'tmp.txt', 'b.txt');

      await apply(dir, await diff(before, after));

      await expect(fs.readFile(path.join(dir, 'a.txt'), 'utf8')).resolves.toBe(
        'b',
      );
      await expect(fs.readFile(path.join(dir, 'b.txt'), 'utf8')).resolves.toBe(
        'a',
      );
      await expect(fs.readdir(dir)).resolves.toEqual(['a.txt', 'b.txt']);
    });
  });
});

describe(remove, () => {
  test('removes a file', () => {
    expect([...remove(tree(['a.txt', 'b.txt']), 'a.txt').keys()]).toEqual([
      'b.txt',
    ]);
  });

  test('removes the files in a directory', () => {
    expect([...remove(tree(['src/a.txt', 'srcs.txt']), 'src').keys()]).toEqual([
      'srcs.txt',
    ]);
  });

  test('removes the files matching a glob', () => {
    expect([
      ...remove(tree(['src/a.test.ts', 'src/a.ts']), 'src/**/*.test.ts').keys(),
    ]).toEqual(['src/a.ts']);
  });
});
