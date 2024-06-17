import * as path from 'node:path'
import { Files } from './types.js'

type FilePath = string

type VirtualFilesChange = {type: 'WRITE', content: Buffer} | {type: 'DELETE'}
type VirtualFilesChanges = Record<FilePath, VirtualFilesChange>

export type StagedFilesystemDiffStatus = 'C' | 'M' | 'D'
export type StagedFilesystemDiff = Record<FilePath, StagedFilesystemDiffStatus>

export interface StagedFiles extends Files {
  diff(): StagedFilesystemDiff
  apply(): void
}

export interface CreateStagedFilesOptions {
  cwd: string
  host: Files
}

export function createStagedFiles({cwd, host}: CreateStagedFilesOptions): StagedFiles {
  const changes: VirtualFilesChanges = {};

  return {

    stat(file) {
      file = path.resolve(cwd, file)
      const change = changes[file]
      if (change?.type === 'DELETE') {
        return undefined
      } else if (change?.type) {
        return {
          isFile: true,
          isDirectory: false
        }
      } else if (Object.entries(changes).filter(([f, change]) => change.type !== 'DELETE').find(([f, change]) => {f.startsWith(`${file}/`)})) {
        return {
          isFile: false,
          isDirectory: true
        }
      } else {
        return host.stat(file)
      }
    },

    read(file) {
      file = path.resolve(cwd, file)
      const change = changes[file]
      if (change && change.type === 'WRITE') return change.content
      if (change && change.type === 'DELETE') return undefined
      return host.read(file)
    },

    write(file, content) {
      file = path.resolve(cwd, file)
      changes[file] = {type: 'WRITE', content}
    },

    delete(file) {
      file = path.resolve(cwd, file)
      changes[file] = {type: 'DELETE'}
    },

    list(directory) {
      directory = path.resolve(cwd, directory)
      
      // node@20 doesn't have the recursive flag so we use a stack
      const list = new Set(host.list(directory))
      
      for (const [fileName, fileChange] of Object.entries(changes)) {
        if (fileChange.type === 'DELETE') {
          // remove files from the list which have been deleted
          list.delete(fileName)
        } else {
          if (fileName.startsWith(`${directory}/`)) {
            // if the added file is within the directory being listed then add it to the list of files
            list.add(fileName)
          }
        }
      }
      
      return Array.from(list).sort()
    },

    diff() {
      const diff: StagedFilesystemDiff = {}

      for (const [fileName, fileChange] of Object.entries<VirtualFilesChange>(changes)) {
        const relativeFileName = path.relative(cwd, fileName)
        if (fileChange.type === 'WRITE') {
          if (host.stat(fileName)) {
            // TODO: check filesystem contents to see if they have changed
            diff[relativeFileName] = 'M'
          } else {
            diff[relativeFileName] = 'C'
          }
        } else if (fileChange.type === 'DELETE') {
          diff[relativeFileName] = 'D'
        }
      }

      return diff;
    },

    apply() {
      for (const [fileName, fileChange] of Object.entries<VirtualFilesChange>(changes)) {
        if (fileChange.type === 'WRITE') {
          host.write(fileName, fileChange.content)
        } else if (fileChange.type === 'DELETE') {
          host.delete(fileName)
        }
      }
    }

  }
}
