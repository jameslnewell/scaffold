import {describe, expect, test, vi} from 'vitest'
import type { Task } from "../types.js";
import { serial } from "./serial.js";

describe(serial, () => {
  test('each task in the array is called', async () => {
    const task1 = vi.fn<Task>()
    const task2 = vi.fn<Task>()
    const context = {cwd: process.cwd()}
    await serial([task1, task2])(context)
    expect(task1).toHaveBeenCalledWith(context)
    expect(task2).toHaveBeenCalledWith(context)
  })
})