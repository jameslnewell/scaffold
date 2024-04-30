import * as FS from 'node:fs'
import * as path from 'node:path'
import { ScaffoldFiles } from './types.js'


export interface CreateMemoryFilesOptions {
  files?: Record<string, string | undefined> | undefined
}

export function createMemoryFiles({files = {}}: CreateMemoryFilesOptions = {}): ScaffoldFiles {
  
  files = Object.entries(files).reduce<Record<string, string | undefined>>(((f, [file, content]) => {
    f[path.resolve(file)] = content
    return f
  }), {})

  return {

    exists(file) {
      file = path.resolve(file)
      return files[file] !== undefined
    },

    read(file: string) {
      file = path.resolve(file)
      const content = files[file]
      if (!content) {
        const error = new Error(`ENOENT: no such file or directory, open '${file}'`);
        (error as any).errno = -2;
        (error as any).code = 'ENOENT';
        (error as any).syscall = 'open';
        (error as any).path = file
        throw error
      }
      return content
    },

    write(file: string, content: string) {
      file = path.resolve(file)
      files[file] = content
    },

    delete(file: string) {
      file = path.resolve(file)
      delete files[file]
    },

    list(directory: string) {
      directory = path.resolve(directory)
      const list: string[] = Object.keys(files).filter(fileName => {
        return fileName.startsWith(`${directory}/`)
      })
      return list.sort()
    },
  }

}
