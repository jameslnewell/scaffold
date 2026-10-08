import * as path from 'node:path';
import type {Scaffold} from '@buildscaffold/core';
import type {ScaffoldOptions} from './define.js';
import type {Task} from '@buildscaffold/task';
import {pathToFileURL} from 'node:url';
import {resolve} from 'import-meta-resolve';

/** A scaffold module as the CLI sees it, since the values of its options are only known at runtime */
export interface LoadedScaffoldModule {
  options?: ScaffoldOptions | undefined;
  scaffold: (options: Record<string, unknown>) => Scaffold;
  tasks?: ((options: Record<string, unknown>) => Task) | undefined;
}

interface LoadScaffoldFromModuleOptions {
  /** The module ID, resolved from `cwd` the same way an `import` would be e.g. `some-package/some-module`, `./some-module.js` or `/path/to/some-module.js` */
  id: string;
  cwd: string;
}

/**
 * Load a scaffold module, whose default export is created with `defineScaffold()`.
 */
export async function loadScaffoldFromModule({
  id,
  cwd,
}: LoadScaffoldFromModuleOptions): Promise<LoadedScaffoldModule> {
  // Resolve with Node's ESM algorithm rather than require.resolve() so the "import" condition of a package's
  // "exports" is honoured. import.meta.resolve() can't be used because it ignores its parent argument unless
  // --experimental-import-meta-resolve is set.
  // Absolute paths are converted to URLs because they aren't valid ESM specifiers on Windows.
  const url = path.isAbsolute(id)
    ? pathToFileURL(id).href
    : resolveId({id, cwd});
  const module = (await import(url)) as {default?: unknown};

  const definition = module.default;
  if (typeof definition !== 'object' || definition === null) {
    throw new Error(
      `Scaffold module "${id}" must have a default export created with defineScaffold()`,
    );
  }
  if (
    !('scaffold' in definition) ||
    typeof definition.scaffold !== 'function'
  ) {
    throw new Error(`Scaffold module "${id}" is missing a scaffold function`);
  }
  if (
    'options' in definition &&
    definition.options !== undefined &&
    (typeof definition.options !== 'object' || definition.options === null)
  ) {
    throw new Error(`Scaffold module "${id}" has invalid options`);
  }
  if (
    'tasks' in definition &&
    definition.tasks !== undefined &&
    typeof definition.tasks !== 'function'
  ) {
    throw new Error(`Scaffold module "${id}" has an invalid tasks function`);
  }

  // the shapes of the options and functions are trusted rather than validated in depth
  return definition as LoadedScaffoldModule;
}

function resolveId({id, cwd}: LoadScaffoldFromModuleOptions): string {
  try {
    return resolve(
      id,
      pathToFileURL(path.join(path.resolve(cwd), path.sep)).href,
    );
  } catch (error) {
    // `npm x -p @buildscaffold/cli -p some-scaffold-package` installs the scaffold package next to the CLI rather
    // than in cwd, so fall back to resolving it from the CLI
    const isNotFound =
      error instanceof Error &&
      'code' in error &&
      error.code === 'ERR_MODULE_NOT_FOUND';
    if (!isNotFound || id.startsWith('.')) throw error;
    return resolve(id, import.meta.url);
  }
}
