import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {run} from './run.js';

// plain JavaScript without imports from the workspace, since the modules live outside it
const brand = `Object.defineProperty(definition, Symbol.for('@buildscaffold/cli/scaffold-module'), {value: true});`;

const greetingModuleSource = `
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const definition = {
  description: 'Writes a greeting',
  options: {
    name: {type: 'string', description: 'Who to greet'},
    fail: {type: 'string', description: 'What should fail', optional: true},
  },
  scaffold: ({name, fail}) => (files) => {
    if (fail === 'scaffold') throw new Error('scaffold failed');
    return files.write('greeting.txt', new TextEncoder().encode('Hello ' + name + '!'));
  },
  tasks: ({options}) => {
    if (options.fail === 'factory') throw new Error('factory failed');
    return {
      type: 'serial',
      tasks: [{
        type: 'function',
        label: 'log the changes',
        when: ({diff}) => diff.size > 0,
        run: async ({directory, diff}) => {
          if (options.fail === 'task') throw new Error('task failed');
          await fs.appendFile(path.join(directory, 'tasks.log'), [...diff.keys()].join(',') + ';');
        },
      }],
    };
  },
};
${brand}
export default definition;
`;

describe(run, () => {
  let dir: string;
  let output: string;
  let log: string[];

  beforeEach(async () => {
    log = [];
    const capture = (...args: unknown[]): void => {
      log.push(args.map(String).join(' '));
    };
    vi.spyOn(console, 'log').mockImplementation(capture);
    vi.spyOn(console, 'warn').mockImplementation(capture);
    vi.spyOn(console, 'error').mockImplementation(capture);
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'buildscaffold-'));
    output = path.join(dir, 'output');
    await fs.writeFile(path.join(dir, 'greeting.mjs'), greetingModuleSource);
  });

  afterEach(async () => {
    await fs.rm(dir, {recursive: true, force: true});
  });

  const greet = (...args: string[]): ReturnType<typeof run> =>
    run({
      argv: ['./greeting.mjs', '--output-directory', 'output', ...args],
      cwd: dir,
      interactive: false,
    });

  const read = (file: string): Promise<string> =>
    fs.readFile(path.join(output, file), 'utf8');

  test('applies the changes and runs the tasks, with options passed without --', async () => {
    const result = await greet('--name', 'Bob', '--apply');

    expect(result).toEqual({
      id: './greeting.mjs',
      options: {name: 'Bob'},
      exitCode: 0,
    });
    await expect(read('greeting.txt')).resolves.toBe('Hello Bob!');
    await expect(read('tasks.log')).resolves.toBe('greeting.txt;');
  });

  test('has nothing to do when run again', async () => {
    await greet('--name', 'Bob', '--apply');
    log = [];

    const result = await greet('--name', 'Bob');

    expect(result.exitCode).toBe(0);
    expect(log).toContain('Nothing to do.');
    await expect(read('tasks.log')).resolves.toBe('greeting.txt;');
  });

  test('applies the changes without calling the tasks factory with --no-tasks', async () => {
    const result = await greet(
      '--name',
      'Bob',
      '--fail',
      'factory',
      '--apply',
      '--no-tasks',
    );
    expect(result.exitCode).toBe(0);
    await expect(read('greeting.txt')).resolves.toBe('Hello Bob!');
    await expect(fs.stat(path.join(output, 'tasks.log'))).rejects.toThrow();
  });

  test('applies nothing when not confirmed', async () => {
    const result = await greet('--name', 'Bob');
    expect(result.exitCode).toBe(0);
    await expect(fs.stat(output)).rejects.toThrow();
  });

  test('fails when a required option is missing and the user cannot be prompted', async () => {
    const result = await greet('--apply');
    expect(result.exitCode).toBe(1);
    expect(log.join('\n')).toContain('Missing required options: --name');
  });

  test('fails for unknown options', async () => {
    const result = await greet('--name', 'Bob', '--unknown', '--apply');
    expect(result.exitCode).toBe(1);
    await expect(fs.stat(output)).rejects.toThrow();
  });

  test('writes nothing when the scaffold fails', async () => {
    const result = await greet(
      '--name',
      'Bob',
      '--fail',
      'scaffold',
      '--apply',
    );
    expect(result.exitCode).toBe(1);
    await expect(fs.stat(output)).rejects.toThrow();
  });

  test('fails when a task fails', async () => {
    const result = await greet('--name', 'Bob', '--fail', 'task', '--apply');
    expect(result.exitCode).toBe(1);
    await expect(read('greeting.txt')).resolves.toBe('Hello Bob!');
  });

  test('prints the description and options with --help', async () => {
    const result = await greet('--help');
    expect(result.exitCode).toBe(0);
    const help = log.join('\n');
    expect(help).toContain('Writes a greeting');
    expect(help).toContain('--name');
    expect(help).toContain('--no-tasks');
  });

  test('fails when an option clashes with a CLI flag', async () => {
    await fs.writeFile(
      path.join(dir, 'clash.mjs'),
      `const definition = {options: {apply: {type: 'boolean', description: 'Apply'}}, scaffold: () => (files) => files};\n${brand}\nexport default definition;`,
    );
    const result = await run({
      argv: ['./clash.mjs'],
      cwd: dir,
      interactive: false,
    });
    expect(result.exitCode).toBe(1);
    expect(log.join('\n')).toContain('has an option named "apply"');
  });

  test('fails when the module is not a scaffold', async () => {
    await fs.writeFile(path.join(dir, 'other.mjs'), 'export default {};');
    const result = await run({
      argv: ['./other.mjs'],
      cwd: dir,
      interactive: false,
    });
    expect(result.exitCode).toBe(1);
  });

  test('reports why a package scaffold failed to load rather than listing the package', async () => {
    const directory = path.join(dir, 'node_modules', 'broken');
    await fs.mkdir(directory, {recursive: true});
    await fs.writeFile(
      path.join(directory, 'package.json'),
      JSON.stringify({name: 'broken', type: 'module', exports: './index.js'}),
    );
    await fs.writeFile(
      path.join(directory, 'index.js'),
      `import 'missing-dependency';\nexport default {};`,
    );
    await expect(
      run({argv: ['broken'], cwd: dir, interactive: false}),
    ).rejects.toThrow('missing-dependency');
  });

  test('lists the scaffolds in a package', async () => {
    const directory = path.join(dir, 'node_modules', 'some-scaffolds');
    await fs.mkdir(directory, {recursive: true});
    await fs.writeFile(
      path.join(directory, 'package.json'),
      JSON.stringify({
        name: 'some-scaffolds',
        type: 'module',
        exports: {'./greeting': './greeting.js', './other': './other.js'},
      }),
    );
    await fs.writeFile(
      path.join(directory, 'greeting.js'),
      greetingModuleSource,
    );
    await fs.writeFile(path.join(directory, 'other.js'), 'export default {};');

    const result = await run({
      argv: ['some-scaffolds'],
      cwd: dir,
      interactive: false,
    });

    expect(result.exitCode).toBe(0);
    const listing = log.join('\n');
    expect(listing).toContain('some-scaffolds/greeting  Writes a greeting');
    expect(listing).not.toContain('some-scaffolds/other');
  });
});
