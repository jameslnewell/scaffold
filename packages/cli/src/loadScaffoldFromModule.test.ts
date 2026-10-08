import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {loadScaffoldFromModule} from './loadScaffoldFromModule.js';

const scaffoldModuleSource = `
export default {
  options: {},
  scaffold: () => (files) => files,
};
`;

describe(loadScaffoldFromModule, () => {
  let cwd: string;

  beforeEach(async () => {
    cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'buildscaffold-'));
    await fs.writeFile(
      path.join(cwd, 'package.json'),
      JSON.stringify({type: 'module'}),
    );
    await fs.writeFile(path.join(cwd, 'local.js'), scaffoldModuleSource);
    await fs.writeFile(path.join(cwd, 'invalid.js'), 'export default {};');

    // a package which can only be imported, not required
    const packageDirectory = path.join(cwd, 'node_modules/esm-only-scaffold');
    await fs.mkdir(packageDirectory, {recursive: true});
    await fs.writeFile(
      path.join(packageDirectory, 'package.json'),
      JSON.stringify({
        name: 'esm-only-scaffold',
        type: 'module',
        exports: {'./greeting': {import: './greeting.js'}},
      }),
    );
    await fs.writeFile(
      path.join(packageDirectory, 'greeting.js'),
      scaffoldModuleSource,
    );
  });

  afterEach(async () => {
    await fs.rm(cwd, {recursive: true, force: true});
  });

  test('loads a module from a package with an "import" export condition', async () => {
    const module = await loadScaffoldFromModule({
      id: 'esm-only-scaffold/greeting',
      cwd,
    });
    expect(module.options).toEqual({});
    expect(module.scaffold).toBeInstanceOf(Function);
  });

  test('loads a module relative to cwd', async () => {
    const module = await loadScaffoldFromModule({id: './local.js', cwd});
    expect(module.scaffold).toBeInstanceOf(Function);
  });

  test('loads a module from an absolute path', async () => {
    const module = await loadScaffoldFromModule({
      id: path.join(cwd, 'local.js'),
      cwd,
    });
    expect(module.scaffold).toBeInstanceOf(Function);
  });

  test('throws when the module has no scaffold function', async () => {
    await expect(
      loadScaffoldFromModule({id: './invalid.js', cwd}),
    ).rejects.toThrow('is missing a scaffold function');
  });

  test('throws when the module cannot be found', async () => {
    await expect(
      loadScaffoldFromModule({id: 'missing-scaffold', cwd}),
    ).rejects.toThrow();
  });
});
