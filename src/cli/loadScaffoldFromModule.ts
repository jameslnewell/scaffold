import * as path from 'node:path'
import { Factory, Prompts, Options } from "../lib/core/types.js"

/**
 * Load the scaffold from a NodeJS module
 * @param id The module ID
 * @returns 
 */
export async function loadScaffoldFromModule(id: string): Promise<{prompts: Prompts, factory: Factory<{}>}> {
  const file = `${path.resolve(id)}.js`
  const module = await import(file)
  const prompts = module.prompts
  const factory = module.factory
  if (typeof prompts === undefined) throw new Error(`Scaffold module ${id} is missing prompts`)
  if (typeof prompts !== 'object') throw new Error(`Scaffold module ${id} has invalid prompts`)
  if (typeof factory === undefined) throw new Error(`Scaffold module ${id} is missing factory`)
  if (typeof factory !== 'function') throw new Error(`Scaffold module ${id} has an invalid factory`)
  return {prompts, factory}
}
