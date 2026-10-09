import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {type Task, labelsOf, planTasks, runTask} from '@buildscaffold/task';
import {apply, diff} from '@buildscaffold/core/diff';
import {isPackageName, listScaffolds, loadScaffold} from './loadScaffold.js';
import {printDiff, printOptions, printTasks} from './print.js';
import yargs, {type Argv, type Options as YargsOptions} from 'yargs';
import {confirm} from '@inquirer/prompts';
import {convertOptionsToYargsOptions} from './convertOptionsToYargsOptions.js';
import {fromDisk} from '@buildscaffold/core/files';
import {hasUncommittedChanges} from './hasUncommittedChanges.js';
import {promptForOptions} from './promptForOptions.js';

const CLI_OPTIONS = {
  'output-directory': {
    type: 'string',
    description:
      'The directory to scaffold into, defaults to the current directory',
  },
  apply: {
    type: 'boolean',
    description:
      'Apply the changes and run the tasks without asking, or --no-apply to only preview them',
  },
  tasks: {
    type: 'boolean',
    default: true,
    description: 'Run the tasks once the changes are applied, or --no-tasks',
  },
  help: {type: 'boolean', description: 'Show help'},
  version: {type: 'boolean', description: 'Show the version'},
} as const satisfies Record<string, YargsOptions>;

// yargs also accepts flags in camel case
const RESERVED_OPTIONS = new Set([
  ...Object.keys(CLI_OPTIONS),
  'outputDirectory',
]);

export interface RunOptions {
  /** The command line arguments e.g. `['some-pkg/create', '--name', 'foo', '--apply']` */
  argv: string[];
  /** The directory relative paths are resolved from */
  cwd: string;
  /** Whether the user can be prompted */
  interactive: boolean;
}

export interface RunResult {
  /** The scaffold module which was run */
  id: string | undefined;
  /** The resolved values of the scaffold's options, when they could be resolved */
  options: Record<string, unknown> | undefined;
  exitCode: number;
}

/**
 * Run the `scaffold` command: load the scaffold module, resolve its options, run its scaffold over the output
 * directory, print the changes and the tasks which would run, and once they're confirmed, apply the changes and
 * run the tasks.
 */
export async function run({
  argv,
  cwd,
  interactive,
}: RunOptions): Promise<RunResult> {
  // the module's options aren't known until it's loaded, so the command line is parsed once for the module and
  // the CLI's own flags, then again with the module's options too
  const cliParser = createParser({
    argv,
    options: CLI_OPTIONS,
    strict: false,
    usage: '$0 <module> [options]',
  });
  const cliArgs = readCliArgs(await cliParser.parse());
  const {id} = cliArgs;

  if (cliArgs.version) {
    console.log(await readVersion());
    return {id, options: undefined, exitCode: 0};
  }
  if (id === undefined) {
    console.log(await cliParser.getHelp());
    return {id, options: undefined, exitCode: cliArgs.help ? 0 : 1};
  }

  let module;
  try {
    module = await loadScaffold({id, cwd});
  } catch (error) {
    // a package of scaffolds doesn't need a main export, since its scaffolds are listed instead, but any other
    // error e.g. from a dependency of the module which can't be found, is the user's to fix
    if (!isPackageName(id) || !isMissingMainExport({error, id})) throw error;
  }
  if (module === undefined) {
    if (!isPackageName(id)) {
      console.error(
        `💥 Scaffold module "${id}" must have a default export created with defineScaffold()`,
      );
      return {id, options: undefined, exitCode: 1};
    }
    return listPackageScaffolds({id, cwd});
  }

  const options = module.options ?? {};
  const reserved = Object.keys(options).find((name) =>
    RESERVED_OPTIONS.has(name),
  );
  if (reserved !== undefined) {
    console.error(
      `💥 Scaffold module "${id}" has an option named "${reserved}", which the CLI uses for its own --${reserved} flag. Rename the option.`,
    );
    return {id, options: undefined, exitCode: 1};
  }

  const parser = createParser({
    argv,
    options: {...CLI_OPTIONS, ...convertOptionsToYargsOptions(options)},
    strict: true,
    usage:
      module.description === undefined
        ? `$0 ${id} [options]`
        : `$0 ${id} [options]\n\n${module.description}`,
  });
  const help = await parser.getHelp();
  if (cliArgs.help) {
    console.log(help);
    return {id, options: undefined, exitCode: 0};
  }

  let args: Record<string, unknown> & {_: Array<string | number>};
  try {
    args = await parser.parse();
  } catch (error) {
    console.error(
      `${help}\n\n💥 ${error instanceof Error ? error.message : String(error)}`,
    );
    return {id, options: undefined, exitCode: 1};
  }
  if (args._.length > 1) {
    console.error(`${help}\n\n💥 Unexpected argument: ${String(args._[1])}`);
    return {id, options: undefined, exitCode: 1};
  }
  const invalid = Object.entries(options).find(
    ([name, option]) =>
      option.type === 'number' &&
      [args[name]].flat().some((value) => Number.isNaN(value)),
  );
  if (invalid) {
    console.error(`${help}\n\n💥 Option --${invalid[0]} must be a number`);
    return {id, options: undefined, exitCode: 1};
  }

  // a flag given without a value e.g. `--name` is parsed as an empty string or array, and isn't a value
  let values = Object.fromEntries(
    Object.keys(options)
      .filter((name) => !isEmpty(args[name]))
      .map((name) => [name, args[name]]),
  );
  const missing = Object.entries(options).filter(
    ([name, option]) => !option.optional && values[name] === undefined,
  );
  if (missing.length > 0) {
    if (!interactive) {
      const flags = missing.map(([name]) => `--${name}`).join(', ');
      console.error(`${help}\n\n💥 Missing required options: ${flags}`);
      return {id, options: undefined, exitCode: 1};
    }
    values = {
      ...values,
      ...(await promptForOptions({options: Object.fromEntries(missing)})),
    };
    console.log('');
  }

  const {
    outputDirectory,
    tasks: runTasks,
    apply: shouldApply,
  } = readCliArgs(args);
  const directory = path.resolve(cwd, outputDirectory ?? '.');
  console.log(`scaffold: ${id}`);
  console.log('');
  printOptions(values);

  // nothing is written when the scaffold fails, since the changes only exist in memory until they're applied
  let changes;
  let plan: Task | undefined;
  try {
    const before = await fromDisk(directory);
    const after = await module.scaffold(values)(before);
    changes = await diff(before, after);
    // with --no-tasks, the tasks factory isn't called, so a factory which needs e.g. a GITHUB_TOKEN can't fail
    const tasks = runTasks
      ? module.tasks?.({options: values, directory})
      : undefined;
    plan = tasks && (await planTasks(tasks, {directory, diff: changes}));
  } catch (error) {
    console.error('💥 The scaffold failed and no changes were made.');
    console.error('');
    console.error(error);
    return {id, options: values, exitCode: 1};
  }
  printDiff(changes);
  const labels = plan ? labelsOf(plan) : [];
  if (labels.length > 0) printTasks(labels);

  if (changes.size === 0 && plan === undefined) {
    console.log('Nothing to do.');
    return {id, options: values, exitCode: 0};
  }

  if (changes.size > 0 && (await hasUncommittedChanges(directory))) {
    console.warn(
      `⚠️  ${directory} is in a git repository with uncommitted changes, so applying can't easily be undone.`,
    );
    console.warn('');
  }

  const confirmed =
    shouldApply ??
    (interactive &&
      (await confirm({message: describeConfirmation({changes, labels})})));
  if (!confirmed) {
    console.log('');
    console.log('Nothing was applied. Pass --apply to apply the changes.');
    return {id, options: values, exitCode: 0};
  }

  if (changes.size > 0) {
    try {
      await apply(directory, changes);
    } catch (error) {
      console.error('');
      console.error(
        '💥 Applying the changes failed, so some of them may have been written.',
      );
      console.error('');
      console.error(error);
      return {id, options: values, exitCode: 1};
    }
    console.log('');
    console.log('The changes were applied.');
  }

  if (plan) {
    console.log('');
    console.log('Running the tasks...');
    console.log('');
    try {
      await runTask(plan, {directory, diff: changes});
    } catch (error) {
      console.error('');
      console.error('💥 A task failed.');
      console.error('');
      console.error(error);
      return {id, options: values, exitCode: 1};
    }
    console.log('');
    console.log('The tasks finished.');
  }

  return {id, options: values, exitCode: 0};
}

interface CliArgs {
  id: string | undefined;
  outputDirectory: string | undefined;
  apply: boolean | undefined;
  tasks: boolean;
  help: boolean;
  version: boolean;
}

function readCliArgs(
  args: Record<string, unknown> & {_: Array<string | number>},
): CliArgs {
  const optionalString = (value: unknown): string | undefined =>
    typeof value === 'string' ? value : undefined;
  return {
    id: args._[0] === undefined ? undefined : String(args._[0]),
    outputDirectory: optionalString(args['output-directory']),
    apply: typeof args['apply'] === 'boolean' ? args['apply'] : undefined,
    tasks: args['tasks'] !== false,
    help: args['help'] === true,
    version: args['version'] === true,
  };
}

interface CreateParserOptions {
  argv: string[];
  options: Record<string, YargsOptions>;
  /** Whether unknown flags are an error */
  strict: boolean;
  usage: string;
}

function createParser({
  argv,
  options,
  strict,
  usage,
}: CreateParserOptions): Argv {
  return (
    yargs(argv)
      .scriptName('scaffold')
      .usage(usage)
      .wrap(Math.min(120, process.stdout.columns || 120))
      // help, version and errors are handled here rather than by yargs, so parsing never exits the process
      .help(false)
      .version(false)
      .exitProcess(false)
      .fail(false)
      .strictOptions(strict)
      .options(options)
  );
}

interface DescribeConfirmationOptions {
  changes: ReadonlyMap<string, unknown>;
  labels: string[];
}

function describeConfirmation({
  changes,
  labels,
}: DescribeConfirmationOptions): string {
  const count = (n: number, noun: string): string =>
    `${String(n)} ${noun}${n === 1 ? '' : 's'}`;
  if (labels.length === 0) return `Apply ${count(changes.size, 'change')}?`;
  if (changes.size === 0) return `Run ${count(labels.length, 'task')}?`;
  return `Apply ${count(changes.size, 'change')} and run ${count(labels.length, 'task')}?`;
}

async function listPackageScaffolds({
  id,
  cwd,
}: {
  id: string;
  cwd: string;
}): Promise<RunResult> {
  const scaffolds = await listScaffolds({id, cwd});
  if (scaffolds.length === 0) {
    console.error(`💥 Package "${id}" doesn't export any scaffolds`);
    return {id, options: undefined, exitCode: 1};
  }
  console.log(`Scaffolds in ${id}:`);
  console.log('');
  const width = Math.max(...scaffolds.map((scaffold) => scaffold.id.length));
  for (const scaffold of scaffolds) {
    console.log(
      `  ${scaffold.id.padEnd(width)}  ${scaffold.description ?? ''}`.trimEnd(),
    );
  }
  console.log('');
  console.log(`Run one with e.g. scaffold ${scaffolds[0]?.id ?? id}`);
  return {id, options: undefined, exitCode: 0};
}

async function readVersion(): Promise<string> {
  const {version} = JSON.parse(
    await fs.readFile(new URL('../package.json', import.meta.url), 'utf8'),
  ) as {version: string};
  return version;
}

interface IsMissingMainExportOptions {
  error: unknown;
  id: string;
}

function isMissingMainExport({error, id}: IsMissingMainExportOptions): boolean {
  if (!(error instanceof Error) || !('code' in error)) return false;
  return (
    error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED' ||
    (error.code === 'ERR_MODULE_NOT_FOUND' && error.message.includes(`'${id}`))
  );
}

function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}
