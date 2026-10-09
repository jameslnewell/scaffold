import {describe, expect, test} from 'vitest';
import {Files} from './Files.js';
import {writeText} from './writeText.js';

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

  test('gives a new file without a mode the default mode', async () => {
    const files = writeText(new Files(), 'a.txt', 'a');
    await expect(files.get('a.txt')?.stat()).resolves.toEqual({
      size: 1,
      mode: 0o644,
    });
  });

  test('keeps the mode of the file it replaces when given no mode', async () => {
    const executable = writeText(new Files(), 'a.sh', 'echo a', {mode: 0o755});
    const files = writeText(executable, 'a.sh', 'echo b');
    await expect(files.get('a.sh')?.stat()).resolves.toEqual({
      size: 6,
      mode: 0o755,
    });
  });
});
