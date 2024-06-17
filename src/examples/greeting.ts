import { ScaffoldFactory, ScaffoldOptions, ScaffoldPrompts } from '../types.js'
import { serial } from '../tasks/serial.js'
import * as npm from '../tasks/npm.js'
import * as git from '../tasks/git.js'
import * as github from '../tasks/github.js'
import * as json from '../scaffolds/json.js'
import * as file from '../scaffolds/file.js'
import { queueTask } from '../scaffolds/queueTask.js'
import { chain } from '../scaffolds/chain.js'

const scaffoldRootDirectory = `${import.meta.dirname}/../..`

export const prompts = {
  name: {
    type: 'string',
    description: 'The name of a person or animal to greet'
  },
} satisfies ScaffoldPrompts

export const factory: ScaffoldFactory<ScaffoldOptions<typeof prompts>> = ({name}) => {
  return chain([
    file.write('greeting.txt', `Hello ${name}!`),
    
    file.copy(`${scaffoldRootDirectory}/fixtures/license.txt`, 'license.txt'),

    file.template(`${scaffoldRootDirectory}/fixtures/post.md.tpl`, 'posts', {
      title: 'One wet and rainy day ☔️', 
      body: 'On this wet and rainy day we have had over 40mm since 9am!'
    }),

    json.merge('greeting.json', {
      name: 'foobar',
      scripts: {
        setup: 'echo "Hello World!"'
      }
    }),

    queueTask(serial([
      npm.install(),
      // npm.run('setup'),
      git.init(),
      git.add(),
      // git.commit(),
      github.createRepo('jameslnewell/scaffold-test'),
      github.addUserToRepo({
        repo: 'jameslnewell/scaffold-test', 
        user: 'jameslnewell-bot', 
        permission: 'push'
      }),
      // github.addTeamToRepo({
      //   repo: 'jameslnewell/scaffold-test', 
      //   team: 'jameslnewell/developers', 
      //   permission: 'push'
      // }),
      // git.addRemote(),
      // git.push()
    ]))

  ])
}