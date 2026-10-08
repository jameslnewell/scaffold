import { Task } from "../types.js"

export function serial(tasks: Task[]): Task {
  return async (context) => {
    for (const task of tasks) {
      await task(context)
    }
  }
}