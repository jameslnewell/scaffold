import { createTasks } from '../../createTasks.js'
import { createMemoryFiles } from '../../createMemoryFiles.js'
import {rm} from './rm.js'

describe(rm, () => {

  test('files are deleted', () => {
    const files = createMemoryFiles({files: {
      'files/package.json': '{"name": "Bob"}'
    }})
    const tasks = createTasks()
    rm('files/**')({files, tasks})
    expect(files.exists('files/package.json')).toBeFalsy()
  })

})