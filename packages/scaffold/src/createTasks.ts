import { Task, Tasks } from "./types.js";

export function createTasks(): Tasks {
  const tasks: Task[] = []
  return {

    queue(task) {
      tasks.push(task)
    },

    [Symbol.iterator]() {
      return tasks[Symbol.iterator]()
    }

  }
}