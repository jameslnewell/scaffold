import * as path from 'node:path'
import type { ScaffoldFactory, ScaffoldPrompts } from "./types.js"
import { pathToFileURL } from 'node:url'
import { resolve } from 'import-meta-resolve'

interface LoadScaffoldFromModuleOptions {
  cwd?: string | undefined
}

interface LoadScaffoldFromModuleOutput {
  prompts: ScaffoldPrompts
  factory: ScaffoldFactory
}

/**
 * Load the scaffold from a NodeJS module
 * @param id The module ID, resolved from `cwd` the same way an `import` would be e.g. `some-package/some-module`, `./some-module.js` or `/path/to/some-module.js`
 * @returns
 */
export async function loadScaffoldFromModule(id: string, {cwd = process.cwd()}: LoadScaffoldFromModuleOptions = {}): Promise<LoadScaffoldFromModuleOutput> {
  cwd = path.resolve(cwd)
  // Resolve with Node's ESM algorithm rather than require.resolve() so the "import" condition of a package's
  // "exports" is honoured. import.meta.resolve() can't be used because it ignores its parent argument unless
  // --experimental-import-meta-resolve is set.
  // Absolute paths are converted to URLs because they aren't valid ESM specifiers on Windows.
  const url = path.isAbsolute(id)
    ? pathToFileURL(id).href
    : resolve(id, pathToFileURL(path.join(cwd, path.sep)).href)
  const module = await import(url) as {prompts?: unknown, factory?: unknown}
  
  const prompts = module.prompts
  if (prompts === undefined) throw new Error(`Scaffold module ${id} is missing prompts`)
  if (typeof prompts !== 'object' || prompts === null) throw new Error(`Scaffold module ${id} has invalid prompts`)
  
  const factory = module.factory
  if (factory === undefined) throw new Error(`Scaffold module ${id} is missing factory`)
  if (typeof factory !== 'function') throw new Error(`Scaffold module ${id} has an invalid factory`)

  // the shapes of the prompts and factory are trusted rather than validated in depth
  return {prompts: prompts as ScaffoldPrompts, factory: factory as ScaffoldFactory}
}
