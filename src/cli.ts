#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from "yargs/helpers";
import { printDiff } from './printDiff.js';
import { printOptions } from './printOptions.js';
import { loadScaffoldFromModule } from './loadScaffoldFromModule.js';
import { extractOptionsFromYargsArgv } from './extractOptionsFromYargsArgv.js';
import { createVirtualFiles } from './createVirtualFiles.js';
import { createTasks } from './createTasks.js';

interface ScaffoldCommandArgv {
  module: string
  apply?: boolean
}

async function main() {
  await yargs(hideBin(process.argv))
    .strict()
    .scriptName('scaffold')
    .hide('help')
    .hide('version')
    .fail((message, error, parser) => {
      parser.showHelp()
      console.log('')
      if (message) {
        console.log(`💥 ${message}`)
      } else {
        console.log(`💥 ${error?.message}`)
      }
      process.exit(1)
    })
    .command<ScaffoldCommandArgv>({
      command: '$0 <module>',
      builder: yargs => yargs
        .positional('module', {
          type: 'string',
          demandOption: true,
          description: 'The scaffold module to run e.g. @scope/pkg/module',
        })
        .option('apply', {
          type: 'boolean',
          demandOption: false,
          description: 'Whether the scaffolded changes should be applied to disk',
        })
        ,
      handler: async (argv) => {
        console.log('')
        console.log(`scaffold: ${argv.module}`)
        console.log('')

        const files = createVirtualFiles()
        const tasks = createTasks()

        // load the scaffold module
        const {prompts, factory} = await loadScaffoldFromModule(argv.module)

        // extract options from the command line args
        const {options, error} = await extractOptionsFromYargsArgv(
          prompts,
          argv._.map(String)
        )
        if (error) {
          console.log(error)
          process.exitCode = 1
          return
        }
        printOptions(options)

        // create the scaffold fn
        const scaffold = factory(options)

        // execute the scaffold fn
        await scaffold({files, tasks})

        // display a diff of the changes
        const diff = files.diff()
        printDiff(diff)

        if (argv.apply) {
          // apply the file changes to disk
          files.apply()
          console.log('Changes applied.')
          console.log('')
  
          // execute the tasks
          for (const task of tasks) {
            await task()
          }
          
        } else {
          console.log('Re-run the command with --apply to write the changes to disk.')
          console.log('')
        }
        
      }
    })
    .parseAsync()
}

void main()