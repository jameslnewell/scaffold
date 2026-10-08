import {Files, readText, writeText} from '@buildscaffold/core/files';
import {describe, expect, test} from 'vitest';
import {template} from './index.js';

describe(template, () => {
  test('merges the rendered tree into the destination', async () => {
    const templates = writeText(new Files(), 'README.md.ejs', '# <%= name %>');
    const destination = writeText(new Files(), 'other.txt', '');

    const files = await template(
      Promise.resolve(templates),
      {name: 'Bob'},
      {
        to: 'docs',
      },
    )(destination);

    expect(files.paths()).toEqual(['docs/README.md', 'other.txt']);
    await expect(readText(files, 'docs/README.md')).resolves.toBe('# Bob');
  });
});
