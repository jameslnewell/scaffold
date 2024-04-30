import { Scaffold, ScaffoldTask } from "../types.js";

export function queueTask(task: ScaffoldTask): Scaffold {
  return async ({tasks}) => {
    tasks.queue(task)
  }
}
