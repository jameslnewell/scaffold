import yargs from 'yargs';
import { convertPromptsToYargsOptions } from './convertPromptsToYargsOptions.js';
import { ScaffoldOptions, ScaffoldPrompts } from './types.js';

export async function extractOptionsFromYargsArgv(prompts: ScaffoldPrompts, argv: string[]): Promise<{error?: string; options: ScaffoldOptions<{}>}> {
  const parser = yargs(argv)
    .strict()
    .hide('help')
    .hide('version')
    .fail(false) 
    .options(convertPromptsToYargsOptions(prompts))
  try {
    const {_, $0, ...options} = parser.parseSync()
    return {options, error: undefined}
  } catch (error: any) {
    return {
      options: {},
      error: `${await parser.getHelp()}\n\n💥 ${error?.message}`
    }
  }
}