import { Task, Tasks } from "./types.js";

export class ArrayTasks implements Tasks {
  #tasks: Task[] = [];

  [Symbol.iterator]() {
    return this.#tasks[Symbol.iterator]()
  }

  addTask(task: Task): void {
    this.#tasks.push(task)
  }

}