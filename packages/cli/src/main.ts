import {hideBin} from 'yargs/helpers';
import {run} from './run.js';
import yargs from 'yargs';

interface ScaffoldCommandArgv {
  module: string;
  cwd?: string | undefined;
  apply?: boolean | undefined;
}

await yargs(hideBin(process.argv))
  .strict()
  .scriptName('scaffold')
  .hide('version')
  // yargs types the error as always present, but it is undefined for validation failures
  .fail((message, error: Error | undefined, parser) => {
    parser.showHelp();
    console.error('');
    console.error(
      `💥 ${message || error?.message || 'An unknown error occurred'}`,
    );
    process.exit(1);
  })
  .command<ScaffoldCommandArgv>({
    command: '$0 <module>',
    describe: 'Run a scaffold. Pass its options after --',
    builder: (yargs) =>
      yargs
        .positional('module', {
          type: 'string',
          demandOption: true,
          description: 'The scaffold module to run e.g. @scope/pkg/module',
        })
        .option('cwd', {
          type: 'string',
          description:
            'The directory to scaffold, defaults to the current directory',
        })
        .option('apply', {
          type: 'boolean',
          description:
            'Apply the changes and run the tasks without asking, or --no-apply to only preview them',
        }),
    handler: async (argv) => {
      try {
        const result = await run({
          id: argv.module,
          cwd: argv.cwd ?? process.cwd(),
          argv: argv._.map(String),
          apply: argv.apply,
          interactive: process.stdin.isTTY,
        });
        process.exitCode = result.exitCode;
      } catch (error) {
        // inquirer rejects when a prompt is cancelled with Ctrl-C
        if (error instanceof Error && error.name === 'ExitPromptError') {
          console.error('');
          console.error('Cancelled.');
          process.exitCode = 130;
          return;
        }
        console.error('💥 ERROR');
        console.error('');
        console.error(error);
        process.exitCode = 1;
      }
    },
  })
  .parseAsync();
