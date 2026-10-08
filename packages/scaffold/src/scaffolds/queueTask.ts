import { Scaffold, Task } from "../types.js";

export function queueTask(task: Task): Scaffold {
  return async ({tasks}) => {
    tasks.queue(task)
  }
}
