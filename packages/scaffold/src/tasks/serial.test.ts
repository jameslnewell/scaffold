import { createStagedFiles } from "../createStagedFiles.js";
import { createTasks } from "../createTasks.js";
import { serial } from "./serial.js";

describe(serial, () => {
  test('each task in the array is called', async () => {
    const task1 = jest.fn()
    const task2 = jest.fn()
    await serial([task1, task2])()
    expect(task1).toHaveBeenCalledWith()
    expect(task2).toHaveBeenCalledWith()
  })
})