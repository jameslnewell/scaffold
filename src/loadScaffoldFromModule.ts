import { Context } from "node:vm";
import { ScaffoldPrompts, ScaffoldFactory } from "./types.js"
import { createRequire } from 'node:module';

/**
 * Load the scaffold from a NodeJS module
 * @param id The module ID
 * @returns 
 */
export async function loadScaffoldFromModule(id: string): Promise<{prompts: ScaffoldPrompts, factory: ScaffoldFactory<any>}> {
  const require = createRequire(process.cwd())  
  const module = await import(require.resolve(id, {paths: [process.cwd()]}))
  
  const prompts = module.prompts
  if (typeof prompts === undefined) throw new Error(`Scaffold module ${id} is missing prompts`)
  if (typeof prompts !== 'object') throw new Error(`Scaffold module ${id} has invalid prompts`)
  
  const factory = module.factory
  if (typeof factory === undefined) throw new Error(`Scaffold module ${id} is missing factory`)
  if (typeof factory !== 'function') throw new Error(`Scaffold module ${id} has an invalid factory`)

  return {prompts, factory}
}
