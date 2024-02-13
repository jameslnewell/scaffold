import * as yargs from 'yargs'
import { Prompts, Options } from '../lib/core/types.js'

/**
 * Convert prompts to yargs options
 */
export function convertPromptsToYargsOptions(prompts: Prompts): { [key: string]: Options } {
  const options: { [key: string]: yargs.Options } = {}

  for (const [name, {type, array, optional, description}] of Object.entries(prompts)) {
    options[name] = {
      type: type === 'boolean'
        ? 'boolean' 
        : type === 'string'
        ? 'string' 
        : type === 'number'
        ? 'number'
        : undefined,
      demandOption: !optional,
      description: description,

      coerce: (value) => {
        if (array) 
          return Array.isArray(value) ? value : [value]
        return value
      }
    }
  }
  return options
}
