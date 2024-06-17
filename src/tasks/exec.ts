import { Task } from "../types.js"
import {exec as execFn, ExecOptions} from '../utilities/exec.js'

export function exec(cmd: string, args: string[], options: ExecOptions = {}): Task {
  return async (ctx) => {
    await execFn(cmd, args, {...options, cwd: ctx.cwd ?? options?.cwd})
  }
}