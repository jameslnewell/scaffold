import { createInMemoryFiles } from '../createInMemoryFiles.js'
import {MatchGlobResult, match} from './match.js'
import * as path from 'path'

describe(match, () => {
  const directory = '.'
  const fooBarFile = 'foo/bar.txt'
  const barFooFile = 'bar/foo.txt'
  const files = createInMemoryFiles({files: {
    [fooBarFile]: Buffer.from('Hello World!'),
    [barFooFile]: Buffer.from('Hello Universe!')
  }})

  test('glob match all files', () => {
    const result = match('**/*')(files) as MatchGlobResult
    expect(result).toBeDefined()
    expect(result?.type).toEqual('glob')
    expect(result?.glob).toEqual(expect.objectContaining({}))
    expect(result?.files.map(f => path.relative('.', f))).toEqual([
      barFooFile,
      fooBarFile,
    ])
  })

  test('glob match not foo files', () => {
    const result = match('**/*', {ignore: ['foo/**']})(files) as MatchGlobResult
    expect(result).toBeDefined()
    expect(result?.type).toEqual('glob')
    expect(result?.glob).toEqual(expect.objectContaining({}))
    expect(result?.files.map(f => path.relative('.', f))).toEqual([
      barFooFile
    ])
  })

  test('file match', () => {
    const result = match(fooBarFile)(files)
    expect(result).toBeDefined()
    expect(result?.type).toEqual('file')
    expect(result?.files.map(f => path.relative('.', f))).toEqual([
      fooBarFile
    ])
  })

  test('directory match', () => {
    const result = match('foo')(files)
    expect(result).toBeDefined()
    expect(result?.type).toEqual('directory')
    expect(result?.files.map(f => path.relative('.', f))).toEqual([
      fooBarFile
    ])
  })

  test('unmatched', () => {
    const result = match('xxx')(files)
    expect(result).toBeUndefined()
  })

})