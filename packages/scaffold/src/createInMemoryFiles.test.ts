import {createInMemoryFiles} from './createInMemoryFiles.js'
import * as path from 'node:path'

describe(createInMemoryFiles, () => {

  describe('.stat()', () => {
    test('isFile=true when a file exists', () => {
      const file = 'foo/bar'
      const content = Buffer.from('Hello World!')
      const files = createInMemoryFiles({files: {[file]: content}})
      expect(files.stat(file)).toEqual({
        isFile: true,
        isDirectory: false
      })
    })

    test('isDirectory=true when a file exists that begins with that path', () => {
      const file = 'foo/bar'
      const content = Buffer.from('Hello World!')
      const files = createInMemoryFiles({files: {[file]: content}})
      expect(files.stat('foo')).toEqual({
        isFile: false,
        isDirectory: true
      })
    })

    test('returns undefined when a path does not exist', () => {
      const files = createInMemoryFiles({})
      expect(files.stat('foo/bar')).toBeUndefined()
    })

  })

  describe('.read()', () => {
    test('returns contrent when file contents are provided in the constructor', () => {
      const file = 'foo.bar'
      const content = Buffer.from('Hello World!')
      const files = createInMemoryFiles({files: {[file]: content}})
      expect(files.read(file)).toEqual(content)
    })
    test('returns undefined when file contents are not provided in the constructor', () => {
      const file = 'foo.bar'
      const files = createInMemoryFiles({files: {}})
      expect(files.read(file)).toBeUndefined()
    })
  })

  describe('.list()', () => {
    test('returns all files provided in the constructor', () => {
      const files = createInMemoryFiles({files: {'a/b/c.txt': Buffer.from('test'), 'a/b/d.txt': Buffer.from('test'), 'a.txt': Buffer.from('test')}})
      expect(files.list('.').map(file => path.relative('.', file))).toEqual(['a.txt', 'a/b/c.txt', 'a/b/d.txt'])
    })
  })
  
})