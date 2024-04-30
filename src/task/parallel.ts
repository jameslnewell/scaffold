import { ScaffoldTask } from "../types.js"

export function parallel(tasks: ScaffoldTask[]): ScaffoldTask {
  return async () => {
    await Promise.all(tasks.map(task => task()))
  }
}