import * as path from 'node:path'
import { Files } from './types.js'

export interface CreateInMemoryFilesOptions {
  cwd?: string | undefined
  files?: Record<string, Buffer | undefined> | undefined
}

export function createInMemoryFiles({
  cwd = process.cwd(), 
  files = {}
}: CreateInMemoryFilesOptions = {}): Files {

  files = Object.entries(files).reduce<Record<string, Buffer | undefined>>(((f, [file, content]) => {
    f[path.resolve(file)] = content
    return f
  }), {})

  return {

    stat(file) {
      file = path.resolve(cwd, file)
      if (files[file]) {
        return {
          isFile: true,
          isDirectory: false
        }
      } else if (Object.keys(files).find(f => f.startsWith(`${file}/`))) {
        return {
          isFile: false,
          isDirectory: true
        }
      } else {
        return undefined
      }
    },

    read(file) {
      file = path.resolve(cwd, file)
      const content = files[file]
      if (content) {
        return content
      } else {
        return undefined
      }
    },

    write(file, content) {
      file = path.resolve(cwd, file)
      files[file] = content
    },

    delete(file: string) {
      file = path.resolve(cwd, file)
      delete files[file]
    },

    list(directory: string) {
      directory = path.resolve(cwd, directory)
      const list: string[] = Object.keys(files).filter(fileName => {
        return fileName.startsWith(`${directory}/`)
      })
      return list.sort()
    },
  }

}
