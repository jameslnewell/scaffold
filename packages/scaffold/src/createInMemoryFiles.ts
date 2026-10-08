import * as path from 'node:path'
import type { Files } from './types.js'

export interface CreateInMemoryFilesOptions {
  cwd?: string | undefined
  files?: Record<string, Buffer | undefined> | undefined
}

export function createInMemoryFiles({
  cwd = process.cwd(), 
  files = {}
}: CreateInMemoryFilesOptions = {}): Files {

  const contents = new Map(Object.entries(files).map(([file, content]) => [path.resolve(file), content]))

  return {

    stat(file) {
      file = path.resolve(cwd, file)
      if (contents.get(file)) {
        return {
          isFile: true,
          isDirectory: false
        }
      } else if ([...contents.keys()].find(f => f.startsWith(`${file}/`))) {
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
      const content = contents.get(file)
      if (content) {
        return content
      } else {
        return undefined
      }
    },

    write(file, content) {
      file = path.resolve(cwd, file)
      contents.set(file, content)
    },

    delete(file: string) {
      file = path.resolve(cwd, file)
      contents.delete(file)
    },

    list(directory: string) {
      directory = path.resolve(cwd, directory)
      const list: string[] = [...contents.keys()].filter(fileName => {
        return fileName.startsWith(`${directory}/`)
      })
      return list.sort()
    },
  }

}
