import { ScaffoldPrompts, ScaffoldFactory } from "./types.js"
import { createRequire } from 'node:module';
import * as path from 'node:path'

interface LoadScaffoldFromModuleOptions {
  cwd?: string | undefined
}

interface LoadScaffoldFromModuleOutput {
  prompts: ScaffoldPrompts
  factory: ScaffoldFactory<any>
}

/**
 * Load the scaffold from a NodeJS module
 * @param id The module ID
 * @returns 
 */
export async function loadScaffoldFromModule(id: string, {cwd = process.cwd()}: LoadScaffoldFromModuleOptions = {}): Promise<LoadScaffoldFromModuleOutput> {
  cwd = path.resolve(cwd)
  const require = createRequire(cwd)  
  const module = await import(require.resolve(id, {paths: [cwd]}))
  
  const prompts = module.prompts
  if (typeof prompts === undefined) throw new Error(`Scaffold module ${id} is missing prompts`)
  if (typeof prompts !== 'object') throw new Error(`Scaffold module ${id} has invalid prompts`)
  
  const factory = module.factory
  if (typeof factory === undefined) throw new Error(`Scaffold module ${id} is missing factory`)
  if (typeof factory !== 'function') throw new Error(`Scaffold module ${id} has an invalid factory`)

  return {prompts, factory}
}
