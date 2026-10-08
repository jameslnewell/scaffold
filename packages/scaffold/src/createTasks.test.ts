import {describe, expect, test} from 'vitest'
import type { Task } from "./types.js";
import { createTasks } from "./createTasks.js";

describe(createTasks, () => {
  test('initially empty', () => {
    const tasks = createTasks()
    expect(Array.from(tasks)).toHaveLength(0)
  })

  test('iterates items in queued order', () => {
    const taskA: Task = async () => {}
    const taskB: Task = async () => {}
    const tasks = createTasks()
    tasks.queue(taskA)
    tasks.queue(taskB)
    expect(Array.from(tasks)).toEqual([
      taskA,
      taskB
    ])
  })
})