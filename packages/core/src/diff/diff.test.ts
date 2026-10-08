import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {DiskContent, Files, fromDisk, writeText} from '../files/index.js';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {diff} from './diff.js';

const encode = (text: string): Uint8Array => new TextEncoder().encode(text);

describe(diff, () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'buildscaffold-'));
  });

  afterEach(async () => {
    await fs.rm(dir, {recursive: true, force: true});
  });

  test('reports creates, modifies and deletes in path order', async () => {
    const before = new Files([
      ['deleted.txt', encode('deleted')],
      ['modified.txt', encode('before')],
      ['unchanged.txt', encode('unchanged')],
    ]);
    const after = writeText(
      writeText(before.remove('deleted.txt'), 'modified.txt', 'after'),
      'created.txt',
      'created',
    );

    const changes = await diff(before, after);

    expect([...changes].map(([file, {type}]) => [file, type])).toEqual([
      ['created.txt', 'create'],
      ['deleted.txt', 'delete'],
      ['modified.txt', 'modify'],
    ]);
  });

  test('does not report a file rewritten with identical bytes', async () => {
    const before = new Files([['a.txt', encode('same')]]);
    const after = writeText(before, 'a.txt', 'same');
    expect((await diff(before, after)).size).toBe(0);
  });

  test('does not read files whose content is unchanged', async () => {
    await fs.writeFile(path.join(dir, 'a.txt'), 'a');
    const read = vi.spyOn(DiskContent.prototype, 'read');
    const before = await fromDisk(dir);
    expect((await diff(before, before)).size).toBe(0);
    expect(read).not.toHaveBeenCalled();
  });

  test('compares replaced disk content by size and then in chunks', async () => {
    const large = Buffer.alloc(200 * 1024, 'a');
    await fs.writeFile(path.join(dir, 'large.txt'), large);
    await fs.writeFile(path.join(dir, 'same.txt'), large);
    const changed = Buffer.from(large);
    changed[changed.length - 1] = 'b'.charCodeAt(0);
    await fs.writeFile(path.join(dir, 'changed.txt'), changed);
    await fs.writeFile(path.join(dir, 'shorter.txt'), 'a');

    const read = vi.spyOn(DiskContent.prototype, 'read');
    const before = new Files([
      ['same', new DiskContent(path.join(dir, 'large.txt'))],
      ['changed', new DiskContent(path.join(dir, 'large.txt'))],
      ['shorter', new DiskContent(path.join(dir, 'large.txt'))],
      ['bytes', new DiskContent(path.join(dir, 'large.txt'))],
    ]);
    const after = new Files([
      ['same', new DiskContent(path.join(dir, 'same.txt'))],
      ['changed', new DiskContent(path.join(dir, 'changed.txt'))],
      ['shorter', new DiskContent(path.join(dir, 'shorter.txt'))],
      ['bytes', large],
    ]);

    const changes = await diff(before, after);

    expect([...changes.keys()]).toEqual(['changed', 'shorter']);
    expect(read).not.toHaveBeenCalled();
  });
});
