import { ArrayTasks } from "./ArrayTasks";

describe(ArrayTasks, () => {
  test('task collection is empty when constructed', () => {
    const tasks = new ArrayTasks()
    expect(Array.from(tasks)).toHaveLength(0)
  })

  test('task collection is not empty when a task has been added', () => {
    const tasks = new ArrayTasks()
    tasks.addTask(() => {/* noop */})
    expect(Array.from(tasks)).toHaveLength(1)
  })
})