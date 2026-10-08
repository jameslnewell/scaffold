import { jest } from '@jest/globals'
import { createStagedFiles } from "../createStagedFiles.js";
import { createTasks } from "../createTasks.js";
import { Task } from "../types.js";
import { serial } from "./serial.js";

describe(serial, () => {
  test('each task in the array is called', async () => {
    const task1 = jest.fn<Task>()
    const task2 = jest.fn<Task>()
    const context = {cwd: process.cwd()}
    await serial([task1, task2])(context)
    expect(task1).toHaveBeenCalledWith(context)
    expect(task2).toHaveBeenCalledWith(context)
  })
})