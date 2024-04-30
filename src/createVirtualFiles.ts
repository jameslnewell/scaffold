import * as FS from 'node:fs'
import * as path from 'node:path'
import { ScaffoldFiles } from './types.js'

type FilePath = string

type VirtualFilesChange = {type: 'WRITE', content: string} | {type: 'DELETE'}
type VirtualFilesChanges = Record<FilePath, VirtualFilesChange>

export type VirtualFilesDiffStatus = 'C' | 'M' | 'D'
export type VirtualFilesDiff = Record<FilePath, VirtualFilesDiffStatus>

export interface VirtualFiles extends ScaffoldFiles {
  diff(): VirtualFilesDiff
  apply(): void
}

export interface CreateVirtualFilesOptions {
  fs?: Partial<Pick<typeof FS, 'existsSync' | 'readdirSync' | 'readFileSync' | 'writeFileSync' | 'unlinkSync'>>
}

export function createVirtualFiles(options: CreateVirtualFilesOptions = {}): VirtualFiles {
  const fs: Required<Required<CreateVirtualFilesOptions>['fs']> = options.fs ? {
    ...FS, 
    ...options.fs
  } : FS
  const changes: VirtualFilesChanges = {};

  return {

    exists(file) {
      file = path.normalize(file)
      const change = changes[file]
      if (change) return change.type !== 'DELETE'
      return fs.existsSync(file)
    },

    read(file: string) {
      file = path.normalize(file)
      const change = changes[file]
      if (change && change.type === 'WRITE') return change.content
      if (change && change.type === 'DELETE') {
        const error = new Error(`ENOENT: no such file or directory, open '${file}'`);
        (error as any).errno = -2;
        (error as any).code = 'ENOENT';
        (error as any).syscall = 'open';
        (error as any).path = file
        throw error
      }
      return fs.readFileSync(file).toString()
    },

    write(file: string, content: string) {
      file = path.normalize(file)
      changes[file] = {type: 'WRITE', content}
    },

    delete(file: string) {
      file = path.normalize(file)
      changes[file] = {type: 'DELETE'}
    },

    list(directory: string) {
      directory = path.normalize(directory)
      
      // node@20 doesn't have the recursive flag so we use a stack
      const stack: string[] = [directory]
      const files: Set<string> = new Set()
      let currentDirectory: string | undefined
      while ((currentDirectory = stack.pop())) {
        for (const entry of fs.readdirSync(currentDirectory, {withFileTypes: true})) {
          const entryPath = path.join(currentDirectory, entry.name)
          if (entry.isDirectory()) {
            stack.push(entryPath)
          } else if (entry.isFile()) {
            files.add(path.normalize(entryPath))
          }
        }
      }

      for (const [fileName, fileChange] of Object.entries(changes)) {
        if (fileChange.type === 'DELETE') {
          // remove files from the list which have been deleted
          files.delete(fileName)
        } else {
          if (fileName.startsWith(`${directory}/`)) {
            // if the added file is within the directory being listed then add it to the list of files
            files.add(fileName)
          }
        }
      }
      
      return Array.from(files).sort()
    },

    diff() {
      const statuses: VirtualFilesDiff = {}

      for (const [fileName, fileChange] of Object.entries<VirtualFilesChange>(changes)) {
        if (fileChange.type === 'WRITE') {
          if (fs.existsSync(fileName)) {
            statuses[fileName] = 'M'
          } else {
            statuses[fileName] = 'C'
          }
        } else if (fileChange.type === 'DELETE') {
          statuses[fileName] = 'D'
        }
      }

      return statuses;
    },

    apply() {
      for (const [fileName, fileChange] of Object.entries<VirtualFilesChange>(changes)) {
        if (fileChange.type === 'WRITE') {
          fs.writeFileSync(fileName, fileChange.content)
        } else if (fileChange.type === 'DELETE') {
          fs.unlinkSync(fileName)
        }
      }
    }


  }

}
