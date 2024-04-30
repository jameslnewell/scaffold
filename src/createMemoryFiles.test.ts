import {createMemoryFiles} from './createMemoryFiles.js'
import * as path from 'node:path'

describe(createMemoryFiles, () => {
  describe('.exists()', () => {
    test('exists when file contents are provided in the constructor', () => {
      const file = 'foo.bar'
      const content = 'Hello World!'
      const files = createMemoryFiles({files: {[file]: content}})
      expect(files.exists(file)).toBeTruthy()
    })
    test('does not exist when file contents are not provided in the constructor', () => {
      const file = 'foo.bar'
      const files = createMemoryFiles({files: {}})
      expect(files.exists(file)).toBeFalsy()
    })
  })

  describe('.read()', () => {
    test('returns contrent when file contents are provided in the constructor', () => {
      const file = 'foo.bar'
      const content = 'Hello World!'
      const files = createMemoryFiles({files: {[file]: content}})
      expect(files.read(file)).toEqual(content)
    })
    test('throws when file contents are not provided in the constructor', () => {
      const file = 'foo.bar'
      const files = createMemoryFiles({files: {}})
      expect(() => files.read(file)).toThrow(/ENOENT/)
    })
  })

  describe('.list()', () => {
    test('returns all files provided in the constructor', () => {
      const files = createMemoryFiles({files: {'a/b/c.txt': 'test', 'a/b/d.txt': 'test', 'a.txt': 'test'}})
      expect(files.list('.').map(file => path.relative('.', file))).toEqual(['a.txt', 'a/b/c.txt', 'a/b/d.txt'])
    })
  })
  
})