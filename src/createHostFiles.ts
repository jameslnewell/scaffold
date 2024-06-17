import * as NodeFs from 'node:fs'
import * as path from 'node:path'
import { Files } from './types.js'

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
      // <node@20 doesn't have the recursive flag so we use a stack
      const stack: string[] = [directory]
      const files: Set<string> = new Set()
      let currentDirectory: string | undefined
      while ((currentDirectory = stack.pop())) {
        for (const entry of host.readdirSync(currentDirectory, {withFileTypes: true})) {
          const entryPath = path.join(currentDirectory, entry.name)
          if (entry.isDirectory()) {
            stack.push(entryPath)
          } else if (entry.isFile()) {
            files.add(path.normalize(entryPath))
          }
        }
      }
      return Array.from(files).sort()
    },
  }

}
