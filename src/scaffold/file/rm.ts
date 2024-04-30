import { Scaffold } from "../../types.js";
import { glob } from "../../utilities/glob.js";

interface RmOptions {
  globOptions?: {
    ignore?: string[] | undefined
  } | undefined
}

/**
 * Copy a set of files from one location to another
 */
export function rm(
  pattern: string, 
  options: RmOptions = {}
): Scaffold {
  return async ({files}) => {
    const result = glob(pattern, options.globOptions)(files)
    for (const file of result.matches) {
      files.delete(file)
    }
  }
}