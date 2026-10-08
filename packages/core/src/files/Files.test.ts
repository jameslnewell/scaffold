import {describe, expect, test} from 'vitest';
import {Files} from './Files.js';

const content = new TextEncoder().encode('content');

describe(Files, () => {
  test('paths are normalised', () => {
    const files = new Files([['./src//index.ts', content]]);
    expect(files.paths()).toEqual(['src/index.ts']);
    expect(files.has('src/./index.ts')).toBe(true);
  });

  test.each(['/etc/passwd', 'C:\\file.txt', '../outside.txt', 'a/../../b'])(
    'paths outside the tree throw e.g. %s',
    (file) => {
      expect(() => new Files().write(file, content)).toThrow();
    },
  );

  test('writing returns a new tree and leaves the original unchanged', () => {
    const original = new Files();
    const changed = original.write('a.txt', content);
    expect(original.has('a.txt')).toBe(false);
    expect(changed.has('a.txt')).toBe(true);
  });

  test('removing returns a new tree and leaves the original unchanged', () => {
    const original = new Files([['a.txt', content]]);
    const changed = original.remove('a.txt');
    expect(original.has('a.txt')).toBe(true);
    expect(changed.has('a.txt')).toBe(false);
  });

  test('content is shared by reference', () => {
    const files = new Files([['a.txt', content]]).write('b.txt', content);
    expect(files.get('a.txt')).toBe(content);
    expect(files.get('b.txt')).toBe(content);
  });

  test('writing with a mode keeps the content', async () => {
    const files = new Files().write('a.sh', content, {mode: 0o755});
    await expect(files.read('a.sh')).resolves.toBe(content);
  });

  test('reading a missing file returns undefined', async () => {
    await expect(new Files().read('missing.txt')).resolves.toBeUndefined();
  });

  test('iterates in path order', () => {
    const files = new Files([
      ['b.txt', content],
      ['a/c.txt', content],
      ['a.txt', content],
    ]);
    expect([...files].map(([file]) => file)).toEqual([
      'a.txt',
      'a/c.txt',
      'b.txt',
    ]);
  });
});
