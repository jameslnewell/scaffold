import type {Task} from '../types.js';

export function parallel(tasks: Task[]): Task {
  return async (context) => {
    await Promise.all(tasks.map((task) => task(context)));
  };
}
