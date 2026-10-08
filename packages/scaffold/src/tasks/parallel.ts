import { Task } from "../types.js"

export function parallel(tasks: Task[]): Task {
  return async () => {
    await Promise.all(tasks.map(task => task()))
  }
}