import {describe, expect, test} from 'vitest';
import {Files} from './Files.js';
import {readText} from './readText.js';
import {writeText} from './writeText.js';

describe(readText, () => {
  test('returns undefined when the file is missing', async () => {
    await expect(readText(new Files(), 'a.txt')).resolves.toBeUndefined();
  });

  test('decodes UTF-8', async () => {
    const files = await writeText(new Files(), 'a.txt', 'Hello ☔️');
    await expect(readText(files, 'a.txt')).resolves.toBe('Hello ☔️');
  });
});
