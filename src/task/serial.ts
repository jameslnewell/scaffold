import { ScaffoldTask } from "../types.js"

export function serial(tasks: ScaffoldTask[]): ScaffoldTask {
  return async () => {
    for (const task of tasks) {
      await task()
    }
  }
}