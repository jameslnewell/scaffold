import yargs from 'yargs';
import { hideBin } from "yargs/helpers";
import { ApplyFiles, ArrayTasks } from '../lib/index.js';
import { convertPromptsToYargsOptions } from './convertPromptsToYargsOptions.js';
import { loadScaffoldFromModule } from './loadScaffoldFromModule.js';

interface ScaffoldArguments {
  module: string
  apply?: boolean
}

async function main() {
  await yargs(hideBin(process.argv))
    .strict()
    .scriptName('module')
    .hide('help')
    .hide('version')
    .command<ScaffoldArguments>({
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
        const files = new ApplyFiles()
        const tasks = new ArrayTasks()

        // load the scaffold module
        const {prompts, factory} = await loadScaffoldFromModule(argv.module)

        // extract options from user
        let options: {} = {}
        const parser = yargs(argv._.map(String))
          .strict()
          .hide('help')
          .hide('version')
          .fail(false)
          .options(convertPromptsToYargsOptions(prompts))
        try {
          const {_, $0, ...otherOptions} = parser.parseSync()
          options = otherOptions
        } catch (error) {
          console.log('')
          console.log(`scaffold: ${argv.module}`)
          console.log('')
          parser.showHelp()
          console.log('')
          console.log(`💥 ${error?.message}`)
          return
        }  
        console.log('Options:', options)

        // create the scaffold fn
        const scaffold = factory(options)

        // execute the scaffold fn
        await scaffold(files, tasks)

        // display a diff of the changes
        // TODO: display diff nicer
        console.log('Diff:', files.diff())

        if (argv.apply) {
          // apply the file changes to disk
          files.apply()
          console.log('Changes applied.')
  
          // run the post write tasks
          for (const task of tasks) {
            await task()
          }
          console.log('Tasks complete.')
        }
        
      }
    })
    .parseAsync()
}

void main()