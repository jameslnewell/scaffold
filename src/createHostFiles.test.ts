import { createHostFiles } from "./createHostFiles.js";

describe(createHostFiles, () => {
  describe('.stat()', () => {
    test('isFile=true when the file exists', () => {
      const file = 'foo/bar'
      const files = createHostFiles({fs: {
        statSync: jest.fn().mockReturnValue({
          isFile() {
            return true
          },
          isDirectory() {
            return false
          }
        })
      }})
      expect(files.stat(file)).toEqual({
        isFile: true,
        isDirectory: false
      })
    })

    test('isDirectory=true when the file does not exist', () => {
      const file = 'foo/bar'
      const files = createHostFiles({fs: {
        statSync: jest.fn().mockReturnValue({
          isFile() {
            return false
          },
          isDirectory() {
            return true
          }
        })
      }})
      expect(files.stat('foo')).toEqual({
        isFile: false,
        isDirectory: true
      })
    })

    test('returns undefined when a path does not exist', () => {
      const files = createHostFiles({fs: {
        statSync: jest.fn().mockReturnValue(undefined)
      }})
      expect(files.stat('foo/bar')).toBeUndefined()
    })
  })

  describe('.read()', () => {
    test('returns a string when the file exists', () => {
      const file = 'foo/bar'
      const content = Buffer.from('Hello World!')
      const files = createHostFiles({fs: {
        readFileSync: jest.fn().mockReturnValue(Buffer.from(content))
      }})
      expect(files.read(file)).toEqual(content)
    })

    test('returns undefiend when the file does not exist', () => {
      const file = 'foo/bar'
      const files = createHostFiles({fs: {
        readFileSync: jest.fn(() => {throw {code: 'ENOENT'}})
      }})
      expect(files.read(file)).toBeUndefined()
    })
  })

  describe('.write()', () => {
    test('writes a file', () => {
      const file = 'foo/bar'
      const content = Buffer.from('Hello World!')
      const writeFileSync = jest.fn()
      const files = createHostFiles({fs: {
        writeFileSync
      }})
      files.write(file, content)
      expect(writeFileSync).toBeCalledWith(`${files.cwd}/${file}`, content)
    })
  })

  describe('.delete()', () => {
    test('deletes a file', () => {
      const file = 'foo/bar'
      const rmSync = jest.fn()
      const files = createHostFiles({fs: {
        rmSync
      }})
      files.delete(file)
      expect(rmSync).toBeCalledWith(`${files.cwd}/${file}`)
    })

    test('throws when the file does not exist', () => {
      const file = 'foo/bar'
      const files = createHostFiles({fs: {
        rmSync: jest.fn(() => {throw new Error('File does not exist')})
      }})
      expect(() => files.delete(file)).toThrow()
    })
  })
})