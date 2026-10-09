import type * as yargs from 'yargs';
import type {ScaffoldOptions} from './define.js';

/**
 * Convert a scaffold's options to yargs options. Required options aren't demanded, so missing ones can be
 * prompted for instead.
 */
export function convertOptionsToYargsOptions(
  options: ScaffoldOptions,
): Record<string, yargs.Options> {
  return Object.fromEntries(
    Object.entries(options).map(([name, option]) => [
      name,
      {
        type: option.type === 'choice' ? 'string' : option.type,
        array: option.array ?? false,
        description: option.optional
          ? option.description
          : `${option.description} [required]`,
        ...(option.type === 'choice' ? {choices: [...option.choices]} : {}),
      } satisfies yargs.Options,
    ]),
  );
}
