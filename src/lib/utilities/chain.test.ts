import { ApplyFiles } from "../core/ApplyFiles";
import { ArrayTasks } from "../core/ArrayTasks";
import { chain } from "./chain";

describe(chain, () => {
  test('each fn in the chain is called', async () => {
    const files = new ApplyFiles()
    const tasks = new ArrayTasks()
    const fn1 = jest.fn()
    const fn2 = jest.fn()
    await chain(fn1, fn2)(files, tasks)
    expect(fn1).toHaveBeenCalledWith(files, tasks)
    expect(fn2).toHaveBeenCalledWith(files, tasks)
  })
})