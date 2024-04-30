import { createTasks } from '../../createTasks.js'
import { createMemoryFiles } from '../../createMemoryFiles.js'
import {template} from './template.js'

describe(template, () => {

  test('substitutes variables', () => {
    const files = createMemoryFiles({files: {
      'tpl/package.json': '{"name": "<%= name %>"}'
    }})
    const tasks = createTasks()
    template('tpl/**/*', 'prj', {name: 'Bob'})({files, tasks})
    expect(files.read('prj/package.json')).toEqual('{"name": "Bob"}')
  })

})