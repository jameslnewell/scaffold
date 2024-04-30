import { Scaffold } from "../../types.js";
import { glob } from "../../utilities/glob.js";
import * as path from "node:path";

interface MoveOptions {
  globOptions?: {
    ignore?: string[] | undefined
  } | undefined
}

/**
 * Copy a set of files from one location to another
 */
export function move(
  pattern: string, 
  destination: string, 
  options: MoveOptions = {}
): Scaffold {
  return async ({files}) => {
    const result = glob(pattern, options.globOptions)(files)
    for (const file of result.matches) {
      files.write(path.resolve(destination, path.relative(result.pattern.base, file)), files.read(file))
      files.delete(file)
    }
  }
}