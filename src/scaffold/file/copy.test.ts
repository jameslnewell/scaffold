import { createTasks } from '../../createTasks.js'
import { createMemoryFiles } from '../../createMemoryFiles.js'
import {copy} from './copy.js'

describe(copy, () => {

  test('files are copied', () => {
    const files = createMemoryFiles({files: {
      'files/package.json': '{"name": "Bob"}'
    }})
    const tasks = createTasks()
    copy('files/**', 'public')({files, tasks})
    expect(files.read('files/package.json')).toEqual('{"name": "Bob"}')
    expect(files.read('public/package.json')).toEqual('{"name": "Bob"}')
  })

})