import type { ScaffoldOptions, ScaffoldPrompts } from './types.js';
import { convertPromptsToYargsOptions } from './convertPromptsToYargsOptions.js';
import yargs from 'yargs';

export async function extractOptionsFromYargsArgv(prompts: ScaffoldPrompts, argv: string[]): Promise<{error?: string | undefined; options: ScaffoldOptions<ScaffoldPrompts>}> {
  const parser = yargs(argv)
    .strict()
    .hide('help')
    .hide('version')
    .fail(false) 
    .options(convertPromptsToYargsOptions(prompts))
  try {
    const argv = parser.parseSync()
    // omit the positional args and script name, and trust yargs to have validated the values against the prompts
    const options = Object.fromEntries(Object.entries(argv).filter(([key]) => key !== '_' && key !== '$0')) as ScaffoldOptions<ScaffoldPrompts>
    return {options, error: undefined}
  } catch (error) {
    return {
      options: {},
      error: `${await parser.getHelp()}\n\n💥 ${error instanceof Error ? error.message : String(error)}`
    }
  }
}