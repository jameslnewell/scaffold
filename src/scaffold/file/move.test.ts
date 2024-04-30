import { createTasks } from '../../createTasks.js'
import { createMemoryFiles } from '../../createMemoryFiles.js'
import {move} from './move.js'

describe(move, () => {

  test('files are moved', () => {
    const files = createMemoryFiles({files: {
      'files/package.json': '{"name": "Bob"}'
    }})
    const tasks = createTasks()
    move('files/**', 'public')({files, tasks})
    expect(files.exists('files/package.json')).toBeFalsy()
    expect(files.read('public/package.json')).toEqual('{"name": "Bob"}')
  })

})