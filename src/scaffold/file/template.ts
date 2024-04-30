import * as ejs from 'ejs'
import { glob } from "../../utilities/glob.js";
import * as path from "node:path";
import { Scaffold } from '../../types.js';

interface TemplateOptions {
  globOptions?: {
    ignore?: string[] | undefined
  } | undefined
}

/**
 * Copy a set of files from one location to another and replace their contents
 */
export function template(
  pattern: string, 
  destination: string, 
  data: Record<string, any>,
  options: TemplateOptions = {}
): Scaffold {
  return async ({files}) => {
    const result = glob(pattern, options.globOptions)(files)
    for (const file of result.matches) {
      const input = files.read(file)
      const template = ejs.compile(input)
      const output = template(data)
      files.write(path.resolve(destination, path.relative(result.pattern.base, file)), output)
    }
  }
}