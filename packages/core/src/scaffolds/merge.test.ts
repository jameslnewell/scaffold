import {Files, readText, writeText} from '../files/index.js';
import {describe, expect, test} from 'vitest';
import {merge} from './merge.js';

describe(merge, () => {
  const destination = writeText(
    writeText(new Files(), 'a.txt', 'destination'),
    'b.txt',
    'destination',
  );
  const overlay = writeText(new Files(), 'a.txt', 'overlay');

  test('overlays the tree, replacing files with the same path', async () => {
    const files = await merge(overlay)(destination);
    expect(files.paths()).toEqual(['a.txt', 'b.txt']);
    await expect(readText(files, 'a.txt')).resolves.toBe('overlay');
  });

  test('overlays a tree which is still loading', async () => {
    const files = await merge(Promise.resolve(overlay))(destination);
    await expect(readText(files, 'a.txt')).resolves.toBe('overlay');
  });

  test('reports a tree which fails to load when the scaffold runs', async () => {
    const scaffold = merge(Promise.reject(new Error('failed to load')));
    // gives an unhandled rejection the chance to be reported before the scaffold runs
    await new Promise((resolve) => setTimeout(resolve, 1));
    await expect(scaffold(destination)).rejects.toThrow('failed to load');
  });

  test('overlays the tree into a directory', async () => {
    const files = await merge(overlay, {to: 'src'})(destination);
    expect(files.paths()).toEqual(['a.txt', 'b.txt', 'src/a.txt']);
  });
});
