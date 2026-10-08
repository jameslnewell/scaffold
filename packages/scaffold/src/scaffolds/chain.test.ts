import { createTasks } from "../createTasks.js";
import { chain } from "./chain.js";
import { createInMemoryFiles } from "../createInMemoryFiles.js";

describe(chain, () => {
  test('each fn in the chain is called', async () => {
    const files = createInMemoryFiles()
    const tasks = createTasks()
    const fn1 = jest.fn()
    const fn2 = jest.fn()
    await chain([fn1, fn2])({files, tasks})
    expect(fn1).toHaveBeenCalledWith({files, tasks})
    expect(fn2).toHaveBeenCalledWith({files, tasks})
  })
})