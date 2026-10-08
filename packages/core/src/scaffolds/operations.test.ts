import {Files, readText} from '../files/index.js';
import {copy, move, remove, write} from './operations.js';
import {describe, expect, test} from 'vitest';
import {pipe} from './pipe.js';

describe(write, () => {
  test('writes text as UTF-8', async () => {
    const files = await write('a.txt', '☔️')(new Files());
    await expect(readText(files, 'a.txt')).resolves.toBe('☔️');
  });

  test('writes bytes', async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const files = await write('a.bin', bytes)(new Files());
    expect(files.get('a.bin')).toBe(bytes);
  });
});

describe('copy, move and remove', () => {
  test('wrap the operations as scaffolds', async () => {
    const files = await pipe(
      write('src/a.txt', 'a'),
      write('src/b.txt', 'b'),
      copy('src', 'copied', {ignore: ['src/b.txt']}),
      move('src/*.txt', 'moved'),
      remove('moved/b.txt'),
    )(new Files());
    expect(files.paths()).toEqual(['copied/a.txt', 'moved/a.txt']);
  });
});
