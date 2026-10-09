import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {Files, fromDisk, writeText} from '../files/index.js';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {DiskFile} from '../files/DiskFile.js';
import type {File} from '../files/File.js';
import {diff} from './diff.js';

function memory(bytes: Uint8Array, mode?: number): File {
  return {
    bytes: () => Promise.resolve(bytes),
    stat: () => Promise.resolve({size: bytes.byteLength, mode}),
  };
}

const text = (value: string): Uint8Array => new TextEncoder().encode(value);

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
      ['deleted.txt', memory(text('deleted'))],
      ['modified.txt', memory(text('before'))],
      ['unchanged.txt', memory(text('unchanged'))],
    ]);
    const after = writeText(
      writeText(before.delete('deleted.txt'), 'modified.txt', 'after'),
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
    const before = new Files([['a.txt', memory(text('same'))]]);
    const after = writeText(before, 'a.txt', 'same');
    expect((await diff(before, after)).size).toBe(0);
  });

  test('reports a file replaced by a file on disk with another mode as modified', async () => {
    await fs.mkdir(path.join(dir, 'before'));
    await fs.mkdir(path.join(dir, 'after'));
    await fs.writeFile(path.join(dir, 'before/a.sh'), 'echo a');
    await fs.writeFile(path.join(dir, 'after/a.sh'), 'echo a');
    await fs.chmod(path.join(dir, 'after/a.sh'), 0o755);
    const before = await fromDisk(path.join(dir, 'before'));
    const executable = (await fromDisk(path.join(dir, 'after'))).get('a.sh');
    if (executable === undefined) throw new Error('missing file');

    const changes = await diff(before, before.set('a.sh', executable));

    expect([...changes.keys()]).toEqual(
      process.platform === 'win32' ? [] : ['a.sh'],
    );
  });

  test('reports a file rewritten with another mode as modified', async () => {
    await fs.writeFile(path.join(dir, 'a.sh'), 'echo a');
    const before = await fromDisk(dir);
    const changes = await diff(
      before,
      writeText(before, 'a.sh', 'echo a', {mode: 0o755}),
    );
    expect([...changes.keys()]).toEqual(
      process.platform === 'win32' ? [] : ['a.sh'],
    );
  });

  test('ignores the mode of other implementations of File, since writeText is the only way to set one', async () => {
    await fs.writeFile(path.join(dir, 'a.sh'), 'echo a');
    const before = await fromDisk(dir);
    const changes = await diff(
      before,
      before.set('a.sh', memory(text('echo a'), 0o755)),
    );
    expect(changes.size).toBe(0);
  });

  test('measures other implementations of File by their bytes rather than their stat', async () => {
    const before = new Files([['a.txt', memory(text('same'))]]);
    const longer = text('same, but longer');
    const after = before.set('a.txt', {
      bytes: () => Promise.resolve(longer),
      stat: () => Promise.resolve({size: 4}),
    });
    expect([...(await diff(before, after)).keys()]).toEqual(['a.txt']);
  });

  test('does not report a file written without a mode as modified', async () => {
    await fs.writeFile(path.join(dir, 'a.sh'), 'echo a');
    await fs.chmod(path.join(dir, 'a.sh'), 0o755);
    const before = await fromDisk(dir);
    const changes = await diff(before, writeText(before, 'a.sh', 'echo a'));
    expect(changes.size).toBe(0);
  });

  test('does not read files which are unchanged', async () => {
    await fs.writeFile(path.join(dir, 'a.txt'), 'a');
    const read = vi.spyOn(DiskFile.prototype, 'bytes');
    const before = await fromDisk(dir);
    expect((await diff(before, before)).size).toBe(0);
    expect(read).not.toHaveBeenCalled();
  });

  test('compares replaced files on disk by size and then in chunks', async () => {
    const large = Buffer.alloc(200 * 1024, 'a');
    await fs.writeFile(path.join(dir, 'large.txt'), large);
    await fs.writeFile(path.join(dir, 'same.txt'), large);
    const changed = Buffer.from(large);
    changed[changed.length - 1] = 'b'.charCodeAt(0);
    await fs.writeFile(path.join(dir, 'changed.txt'), changed);
    await fs.writeFile(path.join(dir, 'shorter.txt'), 'a');

    const read = vi.spyOn(DiskFile.prototype, 'bytes');
    const before = new Files([
      ['same', new DiskFile(path.join(dir, 'large.txt'))],
      ['changed', new DiskFile(path.join(dir, 'large.txt'))],
      ['shorter', new DiskFile(path.join(dir, 'large.txt'))],
      ['bytes', new DiskFile(path.join(dir, 'large.txt'))],
    ]);
    const after = new Files([
      ['same', new DiskFile(path.join(dir, 'same.txt'))],
      ['changed', new DiskFile(path.join(dir, 'changed.txt'))],
      ['shorter', new DiskFile(path.join(dir, 'shorter.txt'))],
      ['bytes', memory(large)],
    ]);

    const changes = await diff(before, after);

    expect([...changes.keys()]).toEqual(['changed', 'shorter']);
    expect(read).not.toHaveBeenCalled();
  });
});
