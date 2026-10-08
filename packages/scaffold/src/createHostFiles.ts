import * as NodeFs from 'node:fs'
import * as path from 'node:path'
import type { Files } from './types.js'

export interface CreateHostFilesOptions {
  cwd?: string | undefined
  fs?: Partial<Pick<typeof NodeFs, 'statSync' | 'readdirSync' | 'readFileSync' | 'writeFileSync' | 'rmSync'>>
}

export function createHostFiles({cwd = process.cwd(), fs}: CreateHostFilesOptions = {}): Files {
  const host: Required<Required<CreateHostFilesOptions>['fs']> = fs ? {
    ...NodeFs, 
    ...fs
  } : NodeFs

  return {

    stat(file) {
      file = path.resolve(cwd, file)
      const stat = host.statSync(file, {throwIfNoEntry: false})
      if (stat) {
        return {
          isFile: stat.isFile(),
          isDirectory: stat.isDirectory(),
        }
      } else {
        return undefined
      }
    },

    read(file) {
      file = path.resolve(cwd, file)
      try {
        return host.readFileSync(file)
      } catch (error: any) {
        if (error?.code === 'ENOENT') {
          return undefined
        } else {
          throw error
        }
      }
    },

    write(file, content) {
      file = path.resolve(cwd, file)
      // TODO: create directory if it doesn't exist
      host.writeFileSync(file, content)
    },

    delete(file: string) {
      file = path.resolve(cwd, file)
      host.rmSync(file)
    },

    list(directory: string) {
      return host.readdirSync(directory, {recursive: true, withFileTypes: true})
        .filter(entry => entry.isFile())
        .map(entry => path.normalize(path.join(entry.parentPath, entry.name)))
        .sort()
    },
  }

}
