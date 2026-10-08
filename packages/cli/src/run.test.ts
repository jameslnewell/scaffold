import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {run} from './run.js';

// plain JavaScript without imports, since the module lives outside the workspace
const scaffoldModuleSource = `
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export default {
  options: {
    name: {type: 'string', description: 'Who to greet'},
    fail: {type: 'string', description: 'What should fail', optional: true},
  },
  scaffold: ({name, fail}) => (files) => {
    if (fail === 'scaffold') throw new Error('scaffold failed');
    return files.write('greeting.txt', new TextEncoder().encode('Hello ' + name + '!'));
  },
  tasks: ({fail}) => async ({cwd, diff}) => {
    if (fail === 'task') throw new Error('task failed');
    await fs.appendFile(path.join(cwd, 'tasks.log'), [...diff.keys()].join(',') + ';');
  },
};
`;

describe(run, () => {
  let dir: string;
  let cwd: string;
  let id: string;

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'buildscaffold-'));
    cwd = path.join(dir, 'project');
    id = path.join(dir, 'greeting.mjs');
    await fs.writeFile(id, scaffoldModuleSource);
  });

  afterEach(async () => {
    await fs.rm(dir, {recursive: true, force: true});
  });

  const read = (file: string): Promise<string> =>
    fs.readFile(path.join(cwd, file), 'utf8');

  test('applies the changes and runs the tasks', async () => {
    const result = await run({
      id,
      cwd,
      argv: ['--name', 'Bob'],
      apply: true,
      interactive: false,
    });

    expect(result).toEqual({id, options: {name: 'Bob'}, exitCode: 0});
    await expect(read('greeting.txt')).resolves.toBe('Hello Bob!');
    await expect(read('tasks.log')).resolves.toBe('greeting.txt;');
  });

  test('reports no changes when run again, and still runs the tasks', async () => {
    const options = {
      id,
      cwd,
      argv: ['--name', 'Bob'],
      apply: true,
      interactive: false,
    };
    await run(options);
    await fs.rm(path.join(cwd, 'tasks.log'));

    await run(options);

    await expect(read('tasks.log')).resolves.toBe(';');
  });

  test('applies nothing when not confirmed', async () => {
    const result = await run({
      id,
      cwd,
      argv: ['--name', 'Bob'],
      interactive: false,
    });
    expect(result.exitCode).toBe(0);
    await expect(fs.stat(cwd)).rejects.toThrow();
  });

  test('fails when a required option is missing and the user cannot be prompted', async () => {
    const result = await run({
      id,
      cwd,
      argv: [],
      apply: true,
      interactive: false,
    });
    expect(result.exitCode).toBe(1);
    await expect(fs.stat(cwd)).rejects.toThrow();
  });

  test('writes nothing when the scaffold fails', async () => {
    const result = await run({
      id,
      cwd,
      argv: ['--name', 'Bob', '--fail', 'scaffold'],
      apply: true,
      interactive: false,
    });
    expect(result.exitCode).toBe(1);
    await expect(fs.stat(cwd)).rejects.toThrow();
  });

  test('fails when a task fails', async () => {
    const result = await run({
      id,
      cwd,
      argv: ['--name', 'Bob', '--fail', 'task'],
      apply: true,
      interactive: false,
    });
    expect(result.exitCode).toBe(1);
    await expect(read('greeting.txt')).resolves.toBe('Hello Bob!');
  });
});
