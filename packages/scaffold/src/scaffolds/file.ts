import * as path from "node:path";
import * as ejs from 'ejs'
import { Files, Scaffold } from "../types.js";
import { match } from "../utilities/match.js";

function rename(sourceDir: string, destDir: string): (file: string) => string {
  return file => path.resolve(destDir, path.relative(sourceDir, file))
}

/**
 * Write content to a file
 * Will replace the file if it already exists
 */
export function write(file: string, content: string | Buffer): Scaffold {
  return async ({files}) => files.write(file, typeof content === 'string' ? Buffer.from(content) : content)
}

interface CopyOptions {
  globOptions?: {
    ignore?: string[] | undefined
  } | undefined
}

/**
 * Copy a set of files from one location to another
 */
export function copy(
  from: string, 
  to: string, 
  options: CopyOptions = {}
): Scaffold {
  return async ({files}) => {
    const result = match(from, options.globOptions)(files)

    if (!result) throw Error(`Invalid source - not a glob, not a directory, not a file`)
    // TODO: make configurable
    if (!result.files.length) throw new Error(`No files were matched`)

    let name: (from: string) => string
    if (result.type === 'glob') {
      // TODO: check destination is a directory
      name = rename(result.glob.base, to)
    } else if (result.type === 'directory') {
      // TODO: check destination is a directory
      name = rename(from, to)
    } else if (result.type === 'file') {
      name = _file => to
    } else {
      throw new Error('Shouldn\'t exist')
    }

    for (const file of result.files) {
      const buffer = files.read(file)
      if (!buffer) throw new Error(`File "${file}" no longer exists`)
      files.write(name(file), buffer)
    }
  }
}

interface MoveOptions {
  globOptions?: {
    ignore?: string[] | undefined
  } | undefined
}

/**
 * Move a set of files from one location to another
 */
export function move(
  from: string, 
  to: string, 
  options: MoveOptions = {}
): Scaffold {
  return async ({files}) => {
    const result = match(from, options.globOptions)(files)

    if (!result) throw Error(`Invalid source - not a glob, not a directory, not a file`)
    // TODO: make configurable
    if (!result.files.length) throw new Error(`No files were matched`)

    let name: (from: string) => string
    if (result.type === 'glob') {
      // TODO: check destination is a directory
      name = rename(result.glob.base, to)
    } else if (result.type === 'directory') {
      // TODO: check destination is a directory
      name = rename(from, to)
    } else if (result.type === 'file') {
      // TODO: check destination does not exist
      name = _file => to
    } else {
      throw new Error('Shouldn\'t exist')
    }

    for (const file of result.files) {
      const buffer = files.read(file)
      if (!buffer) throw new Error(`File "${file}" no longer exists`)
      files.write(name(file), buffer)
      files.delete(file)
    }
  }
}

interface RmOptions {
  globOptions?: {
    ignore?: string[] | undefined
  } | undefined
}

/**
 * Remove a set of files
 */
export function rm(
  from: string, 
  options: RmOptions = {}
): Scaffold {
  return async ({files}) => {
    const result = match(from, options.globOptions)(files)

    if (!result) throw Error(`Invalid source - not a glob, not a directory, not a file`)
    // TODO: make configurable
    if (!result.files.length) throw new Error(`No files were matched`)
  
    for (const file of result.files) {
      files.delete(file)
    }
  }
}

interface TemplateOptions {
  globOptions?: {
    ignore?: string[] | undefined
  } | undefined
}

/**
 * Copy a set of files from one location to another and replace their contents
 */
export function template(
  from: string, 
  to: string, 
  data: Record<string, any>,
  options: TemplateOptions = {}
): Scaffold {
  return async ({files}) => {
    const result = match(from, options.globOptions)(files)

    if (!result) throw Error(`Invalid source - not a glob, not a directory, not a file`)
    // TODO: make configurable
    if (!result.files.length) throw new Error(`No files were matched`)
  
    let name: (from: string) => string
    if (result.type === 'glob') {
      // TODO: check destination is a directory
      name = rename(result.glob.base, to)
    } else if (result.type === 'directory') {
      // TODO: check destination is a directory
      name = rename(from, to)
    } else if (result.type === 'file') {
      // TODO: check destination does not exist
      name = _file => to
    } else {
      throw new Error('Shouldn\'t exist')
    }
  
    for (const file of result.files) {
      const buffer = files.read(file)
      if (!buffer) throw new Error(`File "${file}" no longer exists`)
      const template = ejs.compile(buffer.toString())
      const output = template(data)
      files.write(name(file), Buffer.from(output))
    }

  }
}