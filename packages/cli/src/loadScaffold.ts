import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {SCAFFOLD_MODULE} from './brand.js';
import type {Scaffold} from '@buildscaffold/core';
import type {ScaffoldOptions} from './define.js';
import type {Task} from '@buildscaffold/task';
import {resolve} from 'import-meta-resolve';

/** A scaffold module as the CLI sees it, since the values of its options are only known at runtime */
export interface LoadedScaffoldModule {
  description?: string | undefined;
  options?: ScaffoldOptions | undefined;
  scaffold: (options: Record<string, unknown>) => Scaffold;
  tasks?:
    | ((ctx: {options: Record<string, unknown>; directory: string}) => Task)
    | undefined;
}

interface LoadOptions {
  /** The module ID e.g. `some-package/some-module`, `./some-module.js` or `/path/to/some-module.js` */
  id: string;
  /** The directory relative module IDs and packages are resolved from */
  cwd: string;
}

/**
 * Load a scaffold module, whose default export is created with `defineScaffold()`, or `undefined` when the
 * module isn't a scaffold.
 */
export async function loadScaffold({
  id,
  cwd,
}: LoadOptions): Promise<LoadedScaffoldModule | undefined> {
  const module = (await import(resolveId({id, cwd}))) as {default?: unknown};
  const definition = module.default;
  if (!isScaffoldModule(definition)) return undefined;
  return definition;
}

function isScaffoldModule(value: unknown): value is LoadedScaffoldModule {
  if (
    typeof value !== 'object' ||
    value === null ||
    !(SCAFFOLD_MODULE in value)
  ) {
    return false;
  }
  // the module was created with defineScaffold(), so the shapes of the options and functions are trusted after
  // these checks rather than validated in depth
  if (!('scaffold' in value) || typeof value.scaffold !== 'function') {
    throw new Error('The scaffold module is missing a scaffold function');
  }
  if (
    'tasks' in value &&
    value.tasks !== undefined &&
    typeof value.tasks !== 'function'
  ) {
    throw new Error(
      'The scaffold module has a tasks property which is not a function',
    );
  }
  if (
    'options' in value &&
    value.options !== undefined &&
    (typeof value.options !== 'object' || value.options === null)
  ) {
    throw new Error('The scaffold module has options which are not an object');
  }
  return true;
}

function resolveId({id, cwd}: LoadOptions): string {
  // Absolute paths are converted to URLs because they aren't valid ESM specifiers on Windows
  if (path.isAbsolute(id)) return pathToFileURL(id).href;
  // Resolves with Node's ESM algorithm rather than require.resolve() so the "import" condition of a package's
  // "exports" is honoured. import.meta.resolve() can't be used because it ignores its parent argument unless
  // --experimental-import-meta-resolve is set.
  try {
    return resolve(id, toDirectoryURL(cwd));
  } catch (error) {
    // `npm x -p @buildscaffold/cli -p some-scaffold-package` installs the scaffold package next to the CLI rather
    // than in cwd, so fall back to resolving it from the CLI
    if (!isModuleNotFound(error) || id.startsWith('.')) throw error;
    return resolve(id, import.meta.url);
  }
}

function toDirectoryURL(directory: string): string {
  return pathToFileURL(path.join(path.resolve(directory), path.sep)).href;
}

function isModuleNotFound(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    error.code === 'ERR_MODULE_NOT_FOUND'
  );
}

/** Whether the ID names a whole package e.g. `some-package` or `@scope/package`, rather than a module in one */
export function isPackageName(id: string): boolean {
  return /^(@[^/.][^/]*\/)?[^/.@][^/]*$/.test(id);
}

export interface ListedScaffold {
  id: string;
  description: string | undefined;
}

/**
 * List the scaffolds a package exports, i.e. the `exports` subpaths whose default export was created with
 * `defineScaffold()`.
 */
export async function listScaffolds({
  id: name,
  cwd,
}: LoadOptions): Promise<ListedScaffold[]> {
  const directory = await findPackage({
    name,
    from: [path.resolve(cwd), path.dirname(fileURLToPath(import.meta.url))],
  });
  if (directory === undefined) {
    throw new Error(`Cannot find package "${name}"`);
  }
  const {exports} = JSON.parse(
    await fs.readFile(path.join(directory, 'package.json'), 'utf8'),
  ) as {exports?: unknown};
  const subpaths =
    typeof exports === 'object' && exports !== null
      ? Object.keys(exports).filter(
          (subpath) =>
            subpath.startsWith('./') &&
            !subpath.includes('*') &&
            subpath !== './package.json',
        )
      : [];

  const scaffolds: ListedScaffold[] = [];
  for (const subpath of subpaths) {
    const id = `${name}${subpath.slice(1)}`;
    try {
      const module = await loadScaffold({id, cwd: directory});
      if (module) scaffolds.push({id, description: module.description});
    } catch {
      // an export which can't be loaded isn't a scaffold
    }
  }
  return scaffolds;
}

interface FindPackageOptions {
  name: string;
  from: string[];
}

// walks up from each directory looking for the package in node_modules, or for the package itself so a package
// can list its own scaffolds
async function findPackage({
  name,
  from,
}: FindPackageOptions): Promise<string | undefined> {
  for (const start of from) {
    for (let directory = start; ; directory = path.dirname(directory)) {
      for (const candidate of [
        directory,
        path.join(directory, 'node_modules', name),
      ]) {
        try {
          const {name: found} = JSON.parse(
            await fs.readFile(path.join(candidate, 'package.json'), 'utf8'),
          ) as {name?: unknown};
          if (found === name) return candidate;
        } catch {
          // there's no package.json here
        }
      }
      if (path.dirname(directory) === directory) break;
    }
  }
  return undefined;
}
