import type { Scaffold } from './types.js';
import confirm from '@inquirer/confirm'
import { createHostFiles } from './createHostFiles.js';
import { createStagedFiles } from './createStagedFiles.js';
import { createTasks } from './createTasks.js';
import { extractOptionsFromYargsArgv } from './extractOptionsFromYargsArgv.js';
import { hideBin } from "yargs/helpers";
import { loadScaffoldFromModule } from './loadScaffoldFromModule.js';
import { printDiff } from './printDiff.js';
import { printOptions } from './printOptions.js';
import yargs from 'yargs';

interface ScaffoldCommandArgv {
  module: string
  cwd?: string | undefined
  apply?: boolean | undefined
}

async function main(): Promise<void> {
  await yargs(hideBin(process.argv))
    .strict()
    .scriptName('scaffold')
    .hide('help')
    .hide('version')
    // yargs types the error as always present, but it is undefined for validation failures
    .fail((message, error: Error | undefined, parser) => {
      parser.showHelp()
      console.log('')
      if (message) {
        console.log(`💥 ${message}`)
      } else {
        console.log(`💥 ${error?.message ?? 'An unknown error occurred'}`)
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
        .option('cwd', {
          type: 'string',
          demandOption: false,
          description: 'The directory files will be created in',
        })
        .option('apply', {
          type: 'boolean',
          demandOption: false,
          description: 'Whether the scaffolded changes should be applied to disk',
        })
        ,
      handler: async (argv) => {
        try {
          console.log('')
          console.log(`scaffold: ${argv.module}`)
          console.log('')

          const cwd = argv.cwd ?? process.cwd()
          const files = createStagedFiles({
            cwd,
            host: createHostFiles({cwd})
          })
          const tasks = createTasks()
  
          // load the scaffold module
          const {prompts, factory} = await loadScaffoldFromModule(argv.module, {cwd})
  
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
          let scaffold: Scaffold;
          try {
            scaffold = factory(options)
          } catch (cause) {
            throw new Error('An error occurred whilst creating the scaffold', {cause})
          }
  
          // execute the scaffold fn
          try {
            await scaffold({cwd, files, tasks})
          } catch(cause) {
            throw new Error('An error occurred whilst executing the scaffold', {cause})
          }
  
          // display a diff of the changes
          // TODO: handle error
          const diff = files.diff()
          printDiff(diff)
  
          const hasChanges = Object.keys(diff).length > 0
          if (!hasChanges) {
            console.log(`There are no changes to apply.`)
            console.log('')
          } else {
            let apply = argv.apply
            if (apply === undefined) {
              apply = await confirm({
                message: 'Apply changes?'
              })
              console.log('')
            }
            if (apply) {
              // apply the file changes
              try {
                files.apply()
                console.log('Changes successfully applied.')
                console.log('')
              } catch (cause) {
                throw new Error('An error occurred whilst applying the scaffold', {cause})
              }
      
              // execute the tasks
              // TODO: handle error
              for (const task of tasks) {
                await task({cwd})
              }
              
            } else {
              console.log('Changes were not applied.')
              console.log('')
            }
          }
          
        } catch (error) {
          // TODO: pretty print error
          console.error(`💥 ERROR`)
          console.error('')
          console.error(error)
          process.exitCode = 1
          return
        }
      }
    })
    .parseAsync()
}

void main()