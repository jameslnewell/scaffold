import * as path from 'node:path';
import {apply, diff} from '@buildscaffold/core/diff';
import {printDiff, printOptions} from './print.js';
import type {Task} from '@buildscaffold/task';
import {confirm} from '@inquirer/prompts';
import {extractOptionsFromYargsArgv} from './extractOptionsFromYargsArgv.js';
import {fromDisk} from '@buildscaffold/core/files';
import {loadScaffoldFromModule} from './loadScaffoldFromModule.js';
import {promptForOptions} from './promptForOptions.js';

export interface RunOptions {
  /** The scaffold module to run */
  id: string;
  /** The directory to scaffold */
  cwd: string;
  /** The command line arguments for the scaffold's options */
  argv: string[];
  /** Whether to apply the changes without asking, or not to apply them */
  apply?: boolean | undefined;
  /** Whether the user can be prompted */
  interactive: boolean;
}

export interface RunResult {
  /** The scaffold module which was run */
  id: string;
  /** The resolved values of the scaffold's options, when they could be resolved */
  options: Record<string, unknown> | undefined;
  exitCode: number;
}

/**
 * Run a scaffold module: resolve its options, run its scaffold against the directory, print the changes, and once
 * they're confirmed, apply them and run its tasks.
 */
export async function run({
  id,
  cwd,
  argv,
  apply: shouldApply,
  interactive,
}: RunOptions): Promise<RunResult> {
  cwd = path.resolve(cwd);
  console.log('');
  console.log(`scaffold: ${id}`);
  console.log('');

  const module = await loadScaffoldFromModule({id, cwd});

  const extracted = await extractOptionsFromYargsArgv({
    options: module.options ?? {},
    argv,
  });
  if (extracted.error !== undefined) {
    console.error(`${extracted.help}\n\n💥 ${extracted.error}`);
    return {id, options: undefined, exitCode: 1};
  }
  let options = extracted.values;
  if (extracted.missing.length > 0) {
    if (!interactive) {
      const flags = extracted.missing.map((name) => `--${name}`).join(', ');
      console.error(
        `${extracted.help}\n\n💥 Missing required options: ${flags}`,
      );
      return {id, options: undefined, exitCode: 1};
    }
    const missing = Object.fromEntries(
      Object.entries(module.options ?? {}).filter(([name]) =>
        extracted.missing.includes(name),
      ),
    );
    options = {...options, ...(await promptForOptions({options: missing}))};
    console.log('');
  }
  printOptions(options);

  // nothing is written when the scaffold fails, since the changes only exist in memory until they're applied
  let changes;
  let tasks: Task | undefined;
  try {
    const before = await fromDisk(cwd);
    const after = await module.scaffold(options)(before);
    changes = await diff(before, after);
    tasks = module.tasks?.(options);
  } catch (error) {
    console.error('💥 The scaffold failed and no changes were made.');
    console.error('');
    console.error(error);
    return {id, options, exitCode: 1};
  }
  printDiff(changes);

  if (changes.size === 0 && tasks === undefined) {
    console.log('There is nothing to do.');
    return {id, options, exitCode: 0};
  }

  const confirmed =
    shouldApply ??
    (interactive &&
      (await confirm({
        message:
          changes.size > 0
            ? `Apply the changes${tasks ? ' and run the tasks' : ''}?`
            : 'There are no changes. Run the tasks?',
      })));
  if (!confirmed) {
    console.log('');
    console.log('Nothing was applied. Pass --apply to apply the changes.');
    return {id, options, exitCode: 0};
  }

  if (changes.size > 0) {
    try {
      await apply(cwd, changes);
    } catch (error) {
      console.error('');
      console.error(
        '💥 Applying the changes failed, so some of them may have been written.',
      );
      console.error('');
      console.error(error);
      return {id, options, exitCode: 1};
    }
    console.log('');
    console.log('The changes were applied.');
  }

  if (tasks) {
    console.log('');
    console.log('Running the tasks...');
    console.log('');
    try {
      await tasks({cwd, diff: changes});
    } catch (error) {
      console.error('');
      console.error('💥 A task failed.');
      console.error('');
      console.error(error);
      return {id, options, exitCode: 1};
    }
    console.log('');
    console.log('The tasks finished.');
  }

  return {id, options, exitCode: 0};
}
