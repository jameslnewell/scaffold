import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {DiskContent, fromDisk, writeText} from '../files/index.js';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {apply} from './apply.js';
import {diff} from './diff.js';

describe(apply, () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'buildscaffold-'));
  });

  afterEach(async () => {
    await fs.rm(dir, {recursive: true, force: true});
  });

  const write = async (file: string, text: string): Promise<void> => {
    await fs.mkdir(path.dirname(path.join(dir, file)), {recursive: true});
    await fs.writeFile(path.join(dir, file), text);
  };

  const read = (file: string): Promise<string> =>
    fs.readFile(path.join(dir, file), 'utf8');

  test('creates, modifies and deletes files', async () => {
    await write('modified.txt', 'before');
    await write('deleted/file.txt', 'deleted');
    const before = await fromDisk(dir);
    const after = writeText(
      writeText(before.remove('deleted/file.txt'), 'modified.txt', 'after'),
      'created/file.txt',
      'created',
    );

    await apply(dir, await diff(before, after));

    await expect(read('modified.txt')).resolves.toBe('after');
    await expect(read('created/file.txt')).resolves.toBe('created');
    // the directory is removed too, since it was left empty
    await expect(fs.stat(path.join(dir, 'deleted'))).rejects.toThrow();
  });

  test('swaps two files within the directory', async () => {
    await write('a.txt', 'a');
    await write('b.txt', 'b');
    const before = await fromDisk(dir);
    const a = before.get('a.txt');
    const b = before.get('b.txt');
    if (a === undefined || b === undefined) throw new Error('missing files');
    const after = before.write('a.txt', b).write('b.txt', a);

    await apply(dir, await diff(before, after));

    await expect(read('a.txt')).resolves.toBe('b');
    await expect(read('b.txt')).resolves.toBe('a');
  });

  test('swaps two files when given a different spelling of the directory', async () => {
    await write('a.txt', 'a');
    await write('b.txt', 'b');
    const before = await fromDisk(dir);
    const a = before.get('a.txt');
    const b = before.get('b.txt');
    if (a === undefined || b === undefined) throw new Error('missing files');
    const after = before.write('a.txt', b).write('b.txt', a);

    await apply(await fs.realpath(`${dir}/./`), await diff(before, after));

    await expect(read('a.txt')).resolves.toBe('b');
    await expect(read('b.txt')).resolves.toBe('a');
  });

  test('copies unchanged sources within the directory without reading them', async () => {
    await write('a.txt', 'a');
    const read = vi.spyOn(DiskContent.prototype, 'read');
    const before = await fromDisk(dir);
    const a = before.get('a.txt');
    if (a === undefined) throw new Error('missing file');

    await apply(dir, await diff(before, before.write('copy.txt', a)));

    expect(read).not.toHaveBeenCalled();
    await expect(fs.readFile(path.join(dir, 'copy.txt'), 'utf8')).resolves.toBe(
      'a',
    );
  });

  test('never reads unchanged files when applying to a large directory', async () => {
    const template = path.join(dir, 'template');
    const destination = path.join(dir, 'destination');
    for (let i = 0; i < 100; ++i) {
      const files = Array.from({length: 100}, (_, j) => j);
      await fs.mkdir(path.join(template, String(i)), {recursive: true});
      await Promise.all(
        files.map((j) =>
          fs.writeFile(path.join(template, String(i), `${String(j)}.txt`), ''),
        ),
      );
    }
    await fs.writeFile(
      path.join(template, 'large.bin'),
      Buffer.alloc(64 * 1024 * 1024),
    );
    const read = vi.spyOn(DiskContent.prototype, 'read');

    // populate the destination from the template
    const empty = await fromDisk(destination);
    await apply(destination, await diff(empty, await fromDisk(template)));
    expect(read).not.toHaveBeenCalled();

    // then change one file
    const before = await fromDisk(destination);
    expect(before.size).toBe(10_001);
    const after = writeText(before, '0/0.txt', 'changed');
    const changes = await diff(before, after);
    await apply(destination, changes);

    expect([...changes.keys()]).toEqual(['0/0.txt']);
    expect(read).not.toHaveBeenCalled();
    await expect(
      fs.readFile(path.join(destination, '0/0.txt'), 'utf8'),
    ).resolves.toBe('changed');
    await expect(
      fs.stat(path.join(destination, 'large.bin')),
    ).resolves.toMatchObject({size: 64 * 1024 * 1024});
  }, 60_000);
});
