import {describe, expect, test} from 'vitest';
import {readText, writeText} from './text.js';
import {Files} from './Files.js';

describe(readText, () => {
  test('returns undefined when the file is missing', async () => {
    await expect(readText(new Files(), 'a.txt')).resolves.toBeUndefined();
  });

  test('decodes UTF-8', async () => {
    const files = writeText(new Files(), 'a.txt', 'Hello ☔️');
    await expect(readText(files, 'a.txt')).resolves.toBe('Hello ☔️');
  });
});

describe(writeText, () => {
  test('encodes UTF-8', async () => {
    const files = writeText(new Files(), 'a.txt', '☔️');
    await expect(files.read('a.txt')).resolves.toEqual(
      new TextEncoder().encode('☔️'),
    );
  });
});
