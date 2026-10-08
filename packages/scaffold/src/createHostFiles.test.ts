import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { createHostFiles } from "./createHostFiles.js";

describe(createHostFiles, () => {
  // stat() and read() run against a real directory because node's overloaded fs signatures can't be stubbed type-safely
  let cwd: string
  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-'))
    fs.mkdirSync(path.join(cwd, 'foo'))
    fs.writeFileSync(path.join(cwd, 'foo/bar'), 'Hello World!')
  })
  afterEach(() => {
    fs.rmSync(cwd, {recursive: true, force: true})
  })

  describe('.stat()', () => {
    test('isFile=true when the file exists', () => {
      const files = createHostFiles({cwd})
      expect(files.stat('foo/bar')).toEqual({
        isFile: true,
        isDirectory: false
      })
    })

    test('isDirectory=true when the path is a directory', () => {
      const files = createHostFiles({cwd})
      expect(files.stat('foo')).toEqual({
        isFile: false,
        isDirectory: true
      })
    })

    test('returns undefined when a path does not exist', () => {
      const files = createHostFiles({cwd})
      expect(files.stat('foo/baz')).toBeUndefined()
    })
  })

  describe('.read()', () => {
    test('returns the content when the file exists', () => {
      const files = createHostFiles({cwd})
      expect(files.read('foo/bar')).toEqual(Buffer.from('Hello World!'))
    })

    test('returns undefined when the file does not exist', () => {
      const files = createHostFiles({cwd})
      expect(files.read('foo/baz')).toBeUndefined()
    })
  })

  describe('.list()', () => {
    test('returns the files nested within the directory', () => {
      fs.mkdirSync(path.join(cwd, 'foo/baz/qux'), {recursive: true})
      fs.writeFileSync(path.join(cwd, 'foo/baz/qux/quux'), '')
      fs.writeFileSync(path.join(cwd, 'foo/baz/corge'), '')
      const files = createHostFiles({cwd})
      expect(files.list(cwd)).toEqual([
        path.join(cwd, 'foo/bar'),
        path.join(cwd, 'foo/baz/corge'),
        path.join(cwd, 'foo/baz/qux/quux'),
      ])
    })
  })

  describe('.write()', () => {
    test('writes a file', () => {
      const file = 'foo/bar'
      const content = Buffer.from('Hello World!')
      const writeFileSync = vi.fn()
      const files = createHostFiles({fs: {
        writeFileSync
      }})
      files.write(file, content)
      expect(writeFileSync).toBeCalledWith(`${process.cwd()}/${file}`, content)
    })
  })

  describe('.delete()', () => {
    test('deletes a file', () => {
      const file = 'foo/bar'
      const rmSync = vi.fn()
      const files = createHostFiles({fs: {
        rmSync
      }})
      files.delete(file)
      expect(rmSync).toBeCalledWith(`${process.cwd()}/${file}`)
    })

    test('throws when the file does not exist', () => {
      const file = 'foo/bar'
      const files = createHostFiles({fs: {
        rmSync: vi.fn(() => {throw new Error('File does not exist')})
      }})
      expect(() => files.delete(file)).toThrow()
    })
  })
})