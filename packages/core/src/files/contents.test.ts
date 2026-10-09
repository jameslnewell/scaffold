import {describe, expect, test} from 'vitest';
import {readText, writeText} from './contents.js';
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
    await expect(files.get('a.txt')?.bytes()).resolves.toEqual(
      new TextEncoder().encode('☔️'),
    );
  });

  test('writes a file with a mode', async () => {
    const files = writeText(new Files(), 'a.sh', 'echo a', {mode: 0o755});
    await expect(files.get('a.sh')?.stat()).resolves.toEqual({
      size: 6,
      mode: 0o755,
    });
  });

  test('writes a file without a mode, so an existing file keeps its mode', async () => {
    const files = writeText(new Files(), 'a.sh', 'echo a');
    await expect(files.get('a.sh')?.stat()).resolves.toEqual({
      size: 6,
      mode: undefined,
    });
  });
});
