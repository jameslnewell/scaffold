import * as path from 'node:path'
import pm from 'picomatch'
import { ScaffoldFiles } from '../types.js'

interface GlobOptions {
  ignore?: string[] | undefined
}

interface GlobResult {
  pattern: ReturnType<typeof pm.scan>
  matches: string[]
}

export function glob(
  pattern: string, 
  options: GlobOptions = {}
): (files: ScaffoldFiles) => GlobResult {
  return (fs) => {
    const cwd = process.cwd()
    const matcher = pm(pattern, {
      cwd, 
      ignore: options.ignore
    })
    const result: GlobResult = {
      pattern: pm.scan(pattern),
      matches: []
    }
    
    const files = fs.list(result.pattern.base)
    for (const file of files) {
      const relativeFile = path.relative(cwd, file)
      if (matcher(relativeFile)) {
        result.matches.push(file)
      }
    }

    return result
  }
}
