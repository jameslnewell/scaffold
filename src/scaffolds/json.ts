import { Scaffold } from "../types.js";
import { deepAssign } from "../utilities/deepAssign.js";

interface MergeOptions {
  default?: unknown
}

// TODO: option to error if file doesn't exist
// TODO: use prettier to format the JSON
export function merge(file: string, json: any, options: MergeOptions = {}): Scaffold {
  return  async ({files}) => {
    const buffer = files.read(file)
    const unmerged = buffer ? JSON.parse(buffer.toString()) : options.default
    const merged = deepAssign(unmerged, json)
    files.write(file, Buffer.from(JSON.stringify(merged, null, 2)))
  }
}

interface TransformOptions {
  default?: unknown
}

// TODO: option to error if file doesn't exist
// TODO: use prettier to format the JSON
export function transform(file: string, transform: (json: any) => any, options: TransformOptions = {}): Scaffold {
  return  async ({files}) => {
    const buffer = files.read(file)
    const unmerged = buffer ? JSON.parse(buffer.toString()) : options.default
    const merged = transform(unmerged)
    files.write(file, Buffer.from(JSON.stringify(merged, null, 2)))
  }
}