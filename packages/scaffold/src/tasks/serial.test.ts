import { createStagedFiles } from "../createStagedFiles.js";
import { createTasks } from "../createTasks.js";
import { serial } from "./serial.js";

describe(serial, () => {
  test('each task in the array is called', async () => {
    const task1 = jest.fn()
    const task2 = jest.fn()
    const context = {cwd: process.cwd()}
    await serial([task1, task2])(context)
    expect(task1).toHaveBeenCalledWith(context)
    expect(task2).toHaveBeenCalledWith(context)
  })
})