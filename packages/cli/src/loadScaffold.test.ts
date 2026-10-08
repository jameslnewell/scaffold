import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {isPackageName, listScaffolds, loadScaffold} from './loadScaffold.js';

const brand = `Object.defineProperty(definition, Symbol.for('@buildscaffold/cli/scaffold-module'), {value: true});`;

function moduleSource(definition: string): string {
  return `const definition = ${definition};\n${brand}\nexport default definition;`;
}

describe(isPackageName, () => {
  test.each([
    ['some-package', true],
    ['@scope/package', true],
    ['some-package/create', false],
    ['@scope/package/create', false],
    ['./create.js', false],
    ['/abs/create.js', false],
  ])('%s is %s', (id, expected) => {
    expect(isPackageName(id)).toBe(expected);
  });
});

describe('loading scaffolds', () => {
  let cwd: string;

  beforeEach(async () => {
    cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'buildscaffold-'));
    await fs.writeFile(
      path.join(cwd, 'scaffold.mjs'),
      moduleSource(
        `{description: 'A scaffold', scaffold: () => (files) => files}`,
      ),
    );
    await fs.writeFile(path.join(cwd, 'other.mjs'), 'export default {};');
    await fs.writeFile(
      path.join(cwd, 'invalid.mjs'),
      moduleSource(`{scaffold: () => (files) => files, tasks: 'npm install'}`),
    );

    // a package which can only be imported, not required
    const directory = path.join(cwd, 'node_modules', 'esm-only');
    await fs.mkdir(directory, {recursive: true});
    await fs.writeFile(
      path.join(directory, 'package.json'),
      JSON.stringify({
        name: 'esm-only',
        type: 'module',
        exports: {
          './create': {import: './create.js'},
          './other': {import: './other.js'},
          './*.json': './*.json',
        },
      }),
    );
    await fs.copyFile(
      path.join(cwd, 'scaffold.mjs'),
      path.join(directory, 'create.js'),
    );
    await fs.copyFile(
      path.join(cwd, 'other.mjs'),
      path.join(directory, 'other.js'),
    );
  });

  afterEach(async () => {
    await fs.rm(cwd, {recursive: true, force: true});
  });

  test('loads a module relative to cwd', async () => {
    const module = await loadScaffold({id: './scaffold.mjs', cwd});
    expect(module?.description).toBe('A scaffold');
  });

  test('loads a module from an absolute path', async () => {
    const module = await loadScaffold({
      id: path.join(cwd, 'scaffold.mjs'),
      cwd,
    });
    expect(module?.scaffold).toBeInstanceOf(Function);
  });

  test('loads a module from a package with an "import" export condition', async () => {
    const module = await loadScaffold({id: 'esm-only/create', cwd});
    expect(module?.scaffold).toBeInstanceOf(Function);
  });

  test('returns undefined for a module which is not a scaffold', async () => {
    await expect(
      loadScaffold({id: './other.mjs', cwd}),
    ).resolves.toBeUndefined();
  });

  test('throws for a scaffold module with an invalid shape', async () => {
    await expect(loadScaffold({id: './invalid.mjs', cwd})).rejects.toThrow(
      'tasks property which is not a function',
    );
  });

  test('throws when the module cannot be found', async () => {
    await expect(loadScaffold({id: 'missing-scaffold', cwd})).rejects.toThrow();
  });

  test('lists the scaffolds a package exports', async () => {
    await expect(listScaffolds({id: 'esm-only', cwd})).resolves.toEqual([
      {id: 'esm-only/create', description: 'A scaffold'},
    ]);
  });

  test('throws when listing a package which cannot be found', async () => {
    await expect(listScaffolds({id: 'missing-package', cwd})).rejects.toThrow(
      'Cannot find package "missing-package"',
    );
  });
});
