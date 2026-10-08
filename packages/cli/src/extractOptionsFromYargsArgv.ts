import type {ScaffoldOptions} from './define.js';
import {convertOptionsToYargsOptions} from './convertOptionsToYargsOptions.js';
import yargs from 'yargs';

interface ExtractOptionsFromYargsArgvOptions {
  options: ScaffoldOptions;
  argv: string[];
}

export type ExtractOptionsFromYargsArgvResult =
  | {
      /** The values which were provided */
      values: Record<string, unknown>;
      /** The names of the required options which weren't provided */
      missing: string[];
      /** The help text for the options */
      help: string;
      error?: undefined;
    }
  | {error: string; help: string};

/**
 * Extract the values of a scaffold's options from the command line arguments.
 */
export async function extractOptionsFromYargsArgv({
  options,
  argv,
}: ExtractOptionsFromYargsArgvOptions): Promise<ExtractOptionsFromYargsArgvResult> {
  const parser = yargs(argv)
    .strict()
    .scriptName('scaffold <module> --')
    // the scaffold's options might include --help or --version, and parsing mustn't exit the process
    .help(false)
    .version(false)
    .exitProcess(false)
    .fail(false)
    .options(convertOptionsToYargsOptions(options));
  const help = await parser.getHelp();
  try {
    const parsed = parser.parseSync();
    const invalid = Object.entries(options).find(
      ([name, option]) =>
        option.type === 'number' &&
        [parsed[name]].flat().some((value) => Number.isNaN(value)),
    );
    if (invalid) {
      return {error: `Option --${invalid[0]} must be a number`, help};
    }

    // a flag given without a value e.g. `--name` is parsed as an empty string or array, and isn't a value
    const values = Object.fromEntries(
      Object.keys(options)
        .filter((name) => !isEmpty(parsed[name]))
        .map((name) => [name, parsed[name]]),
    );
    const missing = Object.entries(options)
      .filter(
        ([name, option]) => !option.optional && values[name] === undefined,
      )
      .map(([name]) => name);
    return {values, missing, help};
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      help,
    };
  }
}

function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}
