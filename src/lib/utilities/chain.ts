import { Scaffold } from "../core/types.js";

export function chain(...fns: Scaffold[]): Scaffold {
  return async (files, tasks) => {
    for (const fn of fns) {
      await fn(files, tasks)
    }
  }
}