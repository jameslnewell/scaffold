import {describe, expect, test} from 'vitest'
import { createInMemoryFiles } from '../createInMemoryFiles.js'
import {type MatchGlobResult, match} from './match.js'
import * as path from 'path'

describe(match, () => {
  const fooBarFile = 'foo/bar.txt'
  const barFooFile = 'bar/foo.txt'
  const cwd = process.cwd()
  const files = createInMemoryFiles({files: {
    [fooBarFile]: Buffer.from('Hello World!'),
    [barFooFile]: Buffer.from('Hello Universe!')
  }})

  test('glob match all files', () => {
    const result = match('**/*')({cwd, files}) as MatchGlobResult
    expect(result).toBeDefined()
    expect(result?.type).toEqual('glob')
    expect(result?.glob).toEqual(expect.objectContaining({}))
    expect(result?.files.map(f => path.relative('.', f))).toEqual([
      barFooFile,
      fooBarFile,
    ])
  })

  test('glob match not foo files', () => {
    const result = match('**/*', {ignore: ['foo/**']})({cwd, files}) as MatchGlobResult
    expect(result).toBeDefined()
    expect(result?.type).toEqual('glob')
    expect(result?.glob).toEqual(expect.objectContaining({}))
    expect(result?.files.map(f => path.relative('.', f))).toEqual([
      barFooFile
    ])
  })

  test('file match', () => {
    const result = match(fooBarFile)({cwd, files})
    expect(result).toBeDefined()
    expect(result?.type).toEqual('file')
    expect(result?.files.map(f => path.relative('.', f))).toEqual([
      fooBarFile
    ])
  })

  test('directory match', () => {
    const result = match('foo')({cwd, files})
    expect(result).toBeDefined()
    expect(result?.type).toEqual('directory')
    expect(result?.files.map(f => path.relative('.', f))).toEqual([
      fooBarFile
    ])
  })

  test('unmatched', () => {
    const result = match('xxx')({cwd, files})
    expect(result).toBeUndefined()
  })

})