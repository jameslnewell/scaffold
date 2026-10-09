import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {Files, fromDisk, writeText} from '../files/index.js';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {DiskFile} from '../files/DiskFile.js';
import type {File} from '../files/File.js';
import {apply} from './apply.js';
import {diff} from './diff.js';

// another implementation of File, with a mode
function withMode(bytes: Uint8Array, mode: number): File {
  return {
    bytes: () => Promise.resolve(bytes),
    stat: () => Promise.resolve({size: bytes.byteLength, mode}),
  };
}

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
      writeText(before.delete('deleted/file.txt'), 'modified.txt', 'after'),
      'created/file.txt',
      'created',
    );

    await apply(dir, await diff(before, after));

    await expect(read('modified.txt')).resolves.toBe('after');
    await expect(read('created/file.txt')).resolves.toBe('created');
    // the directory is removed too, since it was left empty
    await expect(fs.stat(path.join(dir, 'deleted'))).rejects.toThrow();
  });

  test('writes a tree to an empty directory', async () => {
    const destination = path.join(dir, 'new');
    const files = writeText(new Files(), 'a/b.txt', 'b');
    await apply(destination, await diff(new Files(), files));
    await expect(
      fs.readFile(path.join(destination, 'a/b.txt'), 'utf8'),
    ).resolves.toBe('b');
  });

  test.skipIf(process.platform === 'win32')(
    'keeps the mode of files copied from disk',
    async () => {
      await write('template/bin/run.sh', 'echo run');
      await fs.chmod(path.join(dir, 'template/bin/run.sh'), 0o755);
      const destination = path.join(dir, 'destination');

      await apply(
        destination,
        await diff(new Files(), await fromDisk(path.join(dir, 'template'))),
      );

      const {mode} = await fs.stat(path.join(destination, 'bin/run.sh'));
      expect(mode & 0o777).toBe(0o755);
    },
  );

  test.skipIf(process.platform === 'win32')(
    'sets the mode of files written with one, keeps the mode of files written without one, and ignores the mode of other implementations of File',
    async () => {
      await write('kept.sh', 'echo kept');
      await fs.chmod(path.join(dir, 'kept.sh'), 0o755);
      const before = await fromDisk(dir);
      let after = writeText(before, 'kept.sh', 'echo changed');
      after = writeText(after, 'executable.sh', 'echo run', {mode: 0o700});
      after = after.set(
        'created.sh',
        withMode(new TextEncoder().encode('echo created'), 0o700),
      );

      await apply(dir, await diff(before, after));

      expect((await fs.stat(path.join(dir, 'kept.sh'))).mode & 0o777).toBe(
        0o755,
      );
      expect(
        (await fs.stat(path.join(dir, 'executable.sh'))).mode & 0o777,
      ).toBe(0o700);
      expect(
        (await fs.stat(path.join(dir, 'created.sh'))).mode & 0o777,
      ).not.toBe(0o700);
    },
  );

  test.skipIf(process.platform === 'win32')(
    'keeps the mode of a file overwritten by another implementation of File without a mode',
    async () => {
      await write('kept.sh', 'echo kept');
      await fs.chmod(path.join(dir, 'kept.sh'), 0o755);
      const before = await fromDisk(dir);
      const bytes = new TextEncoder().encode('source');
      const after = before.set('kept.sh', {
        bytes: () => Promise.resolve(bytes),
        stat: () => Promise.resolve({size: bytes.byteLength}),
      });

      await apply(dir, await diff(before, after));

      await expect(read('kept.sh')).resolves.toBe('source');
      expect((await fs.stat(path.join(dir, 'kept.sh'))).mode & 0o777).toBe(
        0o755,
      );
    },
  );

  test.skipIf(process.platform === 'win32')(
    'keeps the mode of a file copied with set',
    async () => {
      await write('run.sh', 'echo run');
      await fs.chmod(path.join(dir, 'run.sh'), 0o755);
      const before = await fromDisk(dir);
      const run = before.get('run.sh');
      if (run === undefined) throw new Error('missing file');

      await apply(dir, await diff(before, before.set('copy.sh', run)));

      expect((await fs.stat(path.join(dir, 'copy.sh'))).mode & 0o777).toBe(
        0o755,
      );
    },
  );

  test('swaps two files within the directory', async () => {
    await write('a.txt', 'a');
    await write('b.txt', 'b');
    const before = await fromDisk(dir);
    const a = before.get('a.txt');
    const b = before.get('b.txt');
    if (a === undefined || b === undefined) throw new Error('missing files');
    const after = before.set('a.txt', b).set('b.txt', a);

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
    const after = before.set('a.txt', b).set('b.txt', a);

    await apply(await fs.realpath(`${dir}/./`), await diff(before, after));

    await expect(read('a.txt')).resolves.toBe('b');
    await expect(read('b.txt')).resolves.toBe('a');
  });

  test('copies unchanged files within the directory without reading them', async () => {
    await write('a.txt', 'a');
    const read = vi.spyOn(DiskFile.prototype, 'bytes');
    const before = await fromDisk(dir);
    const a = before.get('a.txt');
    if (a === undefined) throw new Error('missing file');

    await apply(dir, await diff(before, before.set('copy.txt', a)));

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
    const read = vi.spyOn(DiskFile.prototype, 'bytes');

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
