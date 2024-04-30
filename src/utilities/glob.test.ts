import { createMemoryFiles } from '../createMemoryFiles.js'
import {glob} from './glob.js'
import * as path from 'path'

describe(glob, () => {
  const directory = '.'
  const fooBarFile = 'foo.bar'
  const barFooFile = 'bar.foo'
  const files = createMemoryFiles({files: {
    [fooBarFile]: 'Hello World!',
    [barFooFile]: 'Hello Universe!'
  }})

  test('lists all files', () => {
    const list = glob('**/*')(files)
    expect(list.matches.map(f => path.relative('.', f))).toEqual([
      barFooFile,
      fooBarFile,
    ])
  })

  test('lists files matching glob', () => {
    const list = glob('**/*.bar')(files)
    expect(list.matches.map(f => path.relative('.', f))).toEqual([fooBarFile,])
  })

  test('lists not matching ignore', () => {
    const list = glob('**/*', {ignore: ['**/*.bar']})(files)
    expect(list.matches.map(f => path.relative('.', f))).toEqual([barFooFile])
  })

})