import { createTasks } from "./createTasks.js";

describe(createTasks, () => {
  test('initially empty', () => {
    const tasks = createTasks()
    expect(Array.from(tasks)).toHaveLength(0)
  })

  test('iterates items in queued order', () => {
    const taskA = async () => {}
    const taskB = async () => {}
    const tasks = createTasks()
    tasks.queue(taskA)
    tasks.queue(taskB)
    expect(Array.from(tasks)).toEqual([
      taskA,
      taskB
    ])
  })
})