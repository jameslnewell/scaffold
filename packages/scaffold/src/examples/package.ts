import { ScaffoldFactory, ScaffoldOptions, ScaffoldPrompts } from "../types.js"

export const prompts = {
  name: {
    type: 'string',
    description: 'The name of a person or animal to greet'
  },
} satisfies ScaffoldPrompts

export const factory: ScaffoldFactory<ScaffoldOptions<typeof prompts>> = ({name}) => {
  return async ({files}) => {
    files.write('greeting.txt', `Hello ${name}!`)
  }
}