import {describe, expect, test, vi} from 'vitest'
import type { Scaffold } from "../types.js";
import { chain } from "./chain.js";
import { createInMemoryFiles } from "../createInMemoryFiles.js";
import { createTasks } from "../createTasks.js";

describe(chain, () => {
  test('each fn in the chain is called', async () => {
    const files = createInMemoryFiles()
    const tasks = createTasks()
    const fn1 = vi.fn<Scaffold>()
    const fn2 = vi.fn<Scaffold>()
    const context = {cwd: process.cwd(), files, tasks}
    await chain([fn1, fn2])(context)
    expect(fn1).toHaveBeenCalledWith(context)
    expect(fn2).toHaveBeenCalledWith(context)
  })
})