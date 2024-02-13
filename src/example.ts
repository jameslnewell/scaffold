import {Factory, Prompts, Options} from './lib/index.js'

export const prompts = {
  name: {
    type: 'string',
    description: 'The name of a person or animal to greet'
  },
} satisfies Prompts

export const factory: Factory<Options<typeof prompts>> = ({name}) => {
  return (files, _tasks) => {
    files.write('greeting.txt', `Hello ${name}!`)
  }
}