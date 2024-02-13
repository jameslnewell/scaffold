import * as o from './configureOptions'
import * as yargs from 'yargs'


const options = o.schema({
  
  cwd: {
    type: 'string',
    description: 'foo'
  },

  grpc_producer: {
    type: 'boolean',
    description: 'Create a GRPC server'
  },

  graphql_producer: {
    type: 'boolean',
    description: 'Create a GRPC server'
  },

  http_producer: {
    type: 'boolean',
    description: 'Create a HTTP server'
  }

})

type OptionsType = o.infer<typeof options>

test('foo', () => {

  o.configureOptions(yargs, options)
  
  const args = yargs.parse(['test', '--cwd', 'dir'])

  console.log(args)
  
})

export const options2 = {
  name: {
    type: 'string',
    description: 'The name of a person or animal to greet.'
  }
} satisfies F