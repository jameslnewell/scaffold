import type { Scaffold, Task } from "../types.js";

export function queueTask(task: Task): Scaffold {
  return ({tasks}) => {
    tasks.queue(task)
  }
}
