import {describe, expect, test} from 'vitest';
import type {File} from './File.js';
import {Files} from './Files.js';

const file: File = {
  bytes: () => Promise.resolve(new TextEncoder().encode('content')),
  stat: () => Promise.resolve({size: 7, mode: 0o644}),
};

describe(Files, () => {
  test('paths are normalised', () => {
    const files = new Files([['./src//index.ts', file]]);
    expect([...files.keys()]).toEqual(['src/index.ts']);
    expect(files.has('src/./index.ts')).toBe(true);
  });

  test.each(['/etc/passwd', 'C:\\file.txt', '../outside.txt', 'a/../../b'])(
    'paths outside the tree throw e.g. %s',
    (path) => {
      expect(() => new Files().set(path, file)).toThrow();
    },
  );

  test('setting returns a new tree and leaves the original unchanged', () => {
    const original = new Files();
    const changed = original.set('a.txt', file);
    expect(original.has('a.txt')).toBe(false);
    expect(changed.has('a.txt')).toBe(true);
    expect(changed.size).toBe(1);
  });

  test('deleting returns a new tree and leaves the original unchanged', () => {
    const original = new Files([['a.txt', file]]);
    const changed = original.delete('a.txt');
    expect(original.has('a.txt')).toBe(true);
    expect(changed.has('a.txt')).toBe(false);
  });

  test('files are shared by reference', () => {
    const files = new Files([['a.txt', file]]).set('b.txt', file);
    expect(files.get('a.txt')).toBe(file);
    expect(files.get('b.txt')).toBe(file);
  });

  test('getting a missing file returns undefined', () => {
    expect(new Files().get('missing.txt')).toBeUndefined();
  });

  test('keys, entries and iteration are in path order', () => {
    const files = new Files([
      ['b.txt', file],
      ['a/c.txt', file],
      ['a.txt', file],
    ]);
    const paths = ['a.txt', 'a/c.txt', 'b.txt'];
    expect([...files.keys()]).toEqual(paths);
    expect([...files.entries()].map(([path]) => path)).toEqual(paths);
    expect([...files.values()]).toEqual([file, file, file]);
    expect([...files].map(([path]) => path)).toEqual(paths);
  });
});
