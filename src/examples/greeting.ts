import { ScaffoldFactory, ScaffoldOptions, ScaffoldPrompts } from '../types.js'
import { serial } from '../task/serial.js'
import * as npm from '../task/npm.js'
import * as git from '../task/git.js'
import * as github from '../task/github.js'
import * as json from '../scaffold/json.js'
import { queueTask } from '../scaffold/queueTask.js'
import { chain } from '../scaffold/chain.js'

export const prompts = {
  name: {
    type: 'string',
    description: 'The name of a person or animal to greet'
  },
} satisfies ScaffoldPrompts

export const factory: ScaffoldFactory<ScaffoldOptions<typeof prompts>> = ({name}) => {
  return chain([
    async ({files}) => files.write('greeting.txt', `Hello ${name}!`),
    
    json.merge('package.json', {}),

    queueTask(serial([
      npm.install(),
      git.init(),
      git.add(),
      git.commit(),
      github.createRepo(),
      github.addUserToRepo(),
      github.addTeamToRepo(),
      git.addRemote(),
      git.push()
    ]))

  ])
}