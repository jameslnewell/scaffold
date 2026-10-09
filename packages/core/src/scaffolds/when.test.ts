import {Files, writeText} from '../files/index.js';
import {describe, expect, test} from 'vitest';
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
    const files = writeText(new Files(), 'README.md', '');
    await expect(scaffold(files)).resolves.toBe(files);
  });
});
