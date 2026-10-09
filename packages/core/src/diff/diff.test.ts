import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {Files, fromDisk, writeText} from '../files/index.js';
import {
  type Mock,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import type {File} from '../files/File.js';
import {diff} from './diff.js';

// another implementation of File
function file(text: string, mode = 0o644): File {
  const bytes = new TextEncoder().encode(text);
  return {
    bytes: () => Promise.resolve(bytes),
    stat: () => Promise.resolve({size: bytes.byteLength, mode}),
  };
}

// the file, with a spy on its reads
function spied(text: string, mode = 0o644): {file: File; read: Mock} {
  const read = vi.fn();
  const inner = file(text, mode);
  return {
    file: {
      bytes: () => {
        read();
        return inner.bytes();
      },
      stat: () => inner.stat(),
    },
    read,
  };
}

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
      ['deleted.txt', file('deleted')],
      ['modified.txt', file('before')],
      ['unchanged.txt', file('unchanged')],
    ]);
    const after = writeText(
      writeText(before.delete('deleted.txt'), 'modified.txt', 'after'),
      'created.txt',
      'created',
    );

    const changes = await diff(before, after);

    expect([...changes].map(([path, {type}]) => [path, type])).toEqual([
      ['created.txt', 'create'],
      ['deleted.txt', 'delete'],
      ['modified.txt', 'modify'],
    ]);
  });

  test('does not report a file rewritten with identical bytes', async () => {
    const before = new Files([['a.txt', file('same')]]);
    const after = writeText(before, 'a.txt', 'same');
    expect((await diff(before, after)).size).toBe(0);
  });

  test('does not read a file which is still the same object', async () => {
    const unchanged = spied('unchanged');
    const before = new Files([['a.txt', unchanged.file]]);
    expect((await diff(before, before.set('b.txt', file('b')))).size).toBe(1);
    expect(unchanged.read).not.toHaveBeenCalled();
  });

  test('does not read files whose sizes differ', async () => {
    const previous = spied('short');
    const replacement = spied('much longer');
    const changes = await diff(
      new Files([['a.txt', previous.file]]),
      new Files([['a.txt', replacement.file]]),
    );
    expect([...changes.keys()]).toEqual(['a.txt']);
    expect(previous.read).not.toHaveBeenCalled();
    expect(replacement.read).not.toHaveBeenCalled();
  });

  test.skipIf(process.platform === 'win32')(
    'reports a file whose mode changed as modified, without reading it',
    async () => {
      const replacement = spied('echo a', 0o755);
      const changes = await diff(
        new Files([['a.sh', file('echo a', 0o644)]]),
        new Files([['a.sh', replacement.file]]),
      );
      expect([...changes.keys()]).toEqual(['a.sh']);
      expect(replacement.read).not.toHaveBeenCalled();
    },
  );

  test('reports a file rewritten with another mode as modified', async () => {
    await fs.writeFile(path.join(dir, 'a.sh'), 'echo a');
    await fs.chmod(path.join(dir, 'a.sh'), 0o644);
    const before = await fromDisk(dir);
    const changes = await diff(
      before,
      writeText(before, 'a.sh', 'echo a', {mode: 0o755}),
    );
    expect([...changes.keys()]).toEqual(
      process.platform === 'win32' ? [] : ['a.sh'],
    );
  });

  test('does not report a file written without a mode as modified', async () => {
    await fs.writeFile(path.join(dir, 'a.sh'), 'echo a');
    await fs.chmod(path.join(dir, 'a.sh'), 0o755);
    const before = await fromDisk(dir);
    const changes = await diff(before, writeText(before, 'a.sh', 'echo a'));
    expect(changes.size).toBe(0);
  });

  test('compares the bytes of files with the same size and mode', async () => {
    const before = new Files([
      ['same', file('aaaa')],
      ['changed', file('aaaa')],
    ]);
    const after = new Files([
      ['same', file('aaaa')],
      ['changed', file('aaab')],
    ]);
    expect([...(await diff(before, after)).keys()]).toEqual(['changed']);
  });
});
