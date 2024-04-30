import { ScaffoldTask, ScaffoldTasks } from "./types.js";

export function createTasks(): ScaffoldTasks {
  const tasks: ScaffoldTask[] = []
  return {

    queue(task) {
      tasks.push(task)
    },

    [Symbol.iterator]() {
      return tasks[Symbol.iterator]()
    }

  }
}