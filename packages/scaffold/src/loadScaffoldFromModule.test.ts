import {afterEach, beforeEach, describe, expect, test} from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { loadScaffoldFromModule } from "./loadScaffoldFromModule.js";

const scaffoldModuleSource = `
export const prompts = {}
export const factory = () => async () => {}
`

describe(loadScaffoldFromModule, () => {
  let cwd: string
  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-'))
    fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({type: 'module'}))
    fs.writeFileSync(path.join(cwd, 'local.js'), scaffoldModuleSource)

    // a package which can only be imported, not required
    const packageDirectory = path.join(cwd, 'node_modules/esm-only-scaffold')
    fs.mkdirSync(packageDirectory, {recursive: true})
    fs.writeFileSync(path.join(packageDirectory, 'package.json'), JSON.stringify({
      name: 'esm-only-scaffold',
      type: 'module',
      exports: {
        './greeting': {import: './greeting.js'}
      }
    }))
    fs.writeFileSync(path.join(packageDirectory, 'greeting.js'), scaffoldModuleSource)
  })
  afterEach(() => {
    fs.rmSync(cwd, {recursive: true, force: true})
  })

  test('loads a module from a package with an "import" export condition', async () => {
    const {prompts, factory} = await loadScaffoldFromModule('esm-only-scaffold/greeting', {cwd})
    expect(prompts).toEqual({})
    expect(factory).toBeInstanceOf(Function)
  })

  test('loads a module relative to cwd', async () => {
    const {factory} = await loadScaffoldFromModule('./local.js', {cwd})
    expect(factory).toBeInstanceOf(Function)
  })

  test('loads a module from an absolute path', async () => {
    const {factory} = await loadScaffoldFromModule(path.join(cwd, 'local.js'), {cwd})
    expect(factory).toBeInstanceOf(Function)
  })

  test('throws when the module cannot be found', async () => {
    await expect(loadScaffoldFromModule('missing-scaffold', {cwd})).rejects.toThrow()
  })
})
