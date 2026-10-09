import {Files, json, readText} from '@buildscaffold/core/files';
import {describe, expect, test} from 'vitest';
import addLicense from './add-license.js';

describe('add-license', () => {
  test('writes the license and updates package.json', async () => {
    const existing = await json.write(new Files(), 'package.json', {name: 'a'});
    const files = await addLicense.scaffold({author: 'Bob', license: 'ISC'})(
      existing,
    );
    await expect(readText(files, 'LICENSE')).resolves.toMatch(
      /^Copyright \d+ Bob/,
    );
    await expect(json.read(files, 'package.json')).resolves.toEqual({
      name: 'a',
      license: 'ISC',
    });
  });

  test('only writes the license when there is no package.json', async () => {
    const files = await addLicense.scaffold({author: 'Bob', license: 'MIT'})(
      new Files(),
    );
    expect([...files.keys()]).toEqual(['LICENSE']);
  });
});
