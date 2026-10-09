import {hideBin} from 'yargs/helpers';
import {run} from './run.js';

try {
  const result = await run({
    argv: hideBin(process.argv),
    cwd: process.cwd(),
    interactive: process.stdin.isTTY,
  });
  process.exitCode = result.exitCode;
} catch (error) {
  // inquirer rejects when a prompt is cancelled with Ctrl-C
  if (error instanceof Error && error.name === 'ExitPromptError') {
    console.error('');
    console.error('Cancelled.');
    process.exitCode = 130;
  } else {
    console.error('💥 ERROR');
    console.error('');
    console.error(error);
    process.exitCode = 1;
  }
}
