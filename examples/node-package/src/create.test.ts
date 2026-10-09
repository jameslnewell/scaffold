import {Files, json, readText} from '@buildscaffold/core/files';
import {describe, expect, test} from 'vitest';
import create from './create.js';

describe('create', () => {
  test('escapes values in package.json', async () => {
    const files = await create.scaffold({
      name: 'my-package',
      author: 'James "Jim" Newell',
    })(new Files());
    await expect(json.read(files, 'package.json')).resolves.toMatchObject({
      author: 'James "Jim" Newell',
    });
  });

  test('creates a package from the templates', async () => {
    const files = await create.scaffold({name: 'my-package', author: 'Bob'})(
      new Files(),
    );
    expect([...files.keys()]).toEqual([
      '.gitignore',
      'LICENSE',
      'README.md',
      'package.json',
      'src/index.js',
    ]);
    await expect(json.read(files, 'package.json')).resolves.toMatchObject({
      name: 'my-package',
      author: 'Bob',
      license: 'MIT',
    });
    await expect(readText(files, 'LICENSE')).resolves.toMatch(/Bob/);
  });
});
