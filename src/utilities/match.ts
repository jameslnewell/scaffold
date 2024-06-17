import * as path from 'node:path'
import pm from 'picomatch'
import { Files } from '../types.js'

export interface MatchOptions {
  ignore?: string[] | undefined
}

export interface MatchGlobResult {
  type: 'glob'
  glob: ReturnType<typeof pm.scan>
  files: string[]
}

export interface MatchDirectoryResult {
  type: 'directory'
  files: string[]
}

export interface MatchFileResult {
  type: 'file'
  files: string[]
}

export function match(source: string, options?: MatchOptions | undefined) {
  return (files: Files): MatchGlobResult | MatchDirectoryResult | MatchFileResult | undefined => {
    const glob = pm.scan(source, {})
    if (glob.isGlob) {
      const matcher = pm(source, {
        ...options,
        cwd: files.cwd, 
      })
      const matches: string[] = []
      for (const file of files.list(glob.base)) {
        const relativeFile = path.relative(files.cwd, file)
        if (matcher(relativeFile)) {
          matches.push(file)
        }
      }
      return {
        type: 'glob',
        glob,
        files: matches
      }
    } else {
      const stat = files.stat(source)
      if (stat?.isDirectory) {
        return {
          type: 'directory',
          files: files.list(source)
        }
      } else if (stat?.isFile) {
        return {
          type: 'file',
          files: [source]
        }
      } else {
        return undefined
      }
    }
  }
}