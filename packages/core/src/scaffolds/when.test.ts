import {describe, expect, test} from 'vitest';
import {Files} from '../files/index.js';
import {when} from './when.js';
import {write} from './operations.js';

describe(when, () => {
  const scaffold = when(
    (files) => Promise.resolve(!files.has('README.md')),
    write('README.md', '# Readme'),
  );

  test('runs the scaffold when the condition is true', async () => {
    const files = await scaffold(new Files());
    expect(files.has('README.md')).toBe(true);
  });

  test('returns the tree unchanged when the condition is false', async () => {
    const files = new Files([['README.md', new Uint8Array()]]);
    await expect(scaffold(files)).resolves.toBe(files);
  });
});
