import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {
  escapeCmdArgument,
  resolveWindowsCommand,
  toWindowsSpawn,
} from './windows.js';
import {exec} from './exec.js';

describe(escapeCmdArgument, () => {
  test.each([
    ['plain', '^"plain^"'],
    ['two words', '^"two^ words^"'],
    ['a&b', '^"a^&b^"'],
    ['a|b<c>d', '^"a^|b^<c^>d^"'],
    ['(x)', '^"^(x^)^"'],
    ['100%', '^"100^%^"'],
    ['wow!', '^"wow^!^"'],
    ['up^', '^"up^^^"'],
    ['say "hi"', '^"say^ \\^"hi\\^"^"'],
    ['dir\\', '^"dir\\\\^"'],
    ['a\\"b', '^"a\\\\\\^"b^"'],
  ])('escapes %s', (argument, expected) => {
    expect(escapeCmdArgument(argument)).toBe(expected);
  });

  test('escapes twice for shims which pass their arguments through cmd.exe again', () => {
    expect(escapeCmdArgument('a&b', {doubleEscape: true})).toBe(
      '^^^"a^^^&b^^^"',
    );
  });
});

describe('resolving commands', () => {
  let dir: string;
  let bin: string;
  let other: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'buildscaffold-'));
    bin = path.join(dir, 'bin');
    other = path.join(dir, 'other');
    await fs.mkdir(bin);
    await fs.mkdir(other);
    await fs.writeFile(path.join(bin, 'npm.CMD'), '');
    await fs.writeFile(path.join(other, 'npm.EXE'), '');
    await fs.writeFile(path.join(other, 'git.EXE'), '');
    await fs.writeFile(path.join(dir, 'local.BAT'), '');
  });

  afterEach(async () => {
    await fs.rm(dir, {recursive: true, force: true});
  });

  const resolve = (command: string): Promise<string | undefined> =>
    resolveWindowsCommand({
      command,
      cwd: dir,
      path: `${bin};${other}`,
      pathext: '.EXE;.CMD;.BAT',
    });

  test('finds the first directory in PATH with a file for the command', async () => {
    await expect(resolve('npm')).resolves.toBe(path.join(bin, 'npm.CMD'));
    await expect(resolve('git')).resolves.toBe(path.join(other, 'git.EXE'));
  });

  test('tries the extensions in PATHEXT order within a directory', async () => {
    await fs.writeFile(path.join(bin, 'npm.EXE'), '');
    await expect(resolve('npm')).resolves.toBe(path.join(bin, 'npm.EXE'));
  });

  test('does not look in the working directory for a command without a directory', async () => {
    await expect(resolve('local')).resolves.toBeUndefined();
  });

  test('resolves a command with a directory from the working directory', async () => {
    await expect(resolve('./local')).resolves.toBe(path.join(dir, 'local.BAT'));
  });

  test('unquotes directories in PATH', async () => {
    await expect(
      resolveWindowsCommand({
        command: 'npm',
        cwd: dir,
        path: `"${bin}"`,
        pathext: '.CMD',
      }),
    ).resolves.toBe(path.join(bin, 'npm.CMD'));
  });

  test('ignores extensions in PATHEXT which cannot be run', async () => {
    await fs.writeFile(path.join(bin, 'node.JS'), '');
    await fs.writeFile(path.join(other, 'node.EXE'), '');
    await expect(
      resolveWindowsCommand({
        command: 'node',
        cwd: dir,
        path: `${bin};${other}`,
        pathext: '.JS;.EXE',
      }),
    ).resolves.toBe(path.join(other, 'node.EXE'));
  });

  test('uses the default extensions when PATHEXT is empty', async () => {
    await expect(
      resolveWindowsCommand({command: 'npm', cwd: dir, path: bin, pathext: ''}),
    ).resolves.toBe(path.join(bin, 'npm.CMD'));
  });

  test('uses a command which already has an extension as-is', async () => {
    await expect(resolve('npm.EXE')).resolves.toBe(path.join(other, 'npm.EXE'));
  });

  test('returns undefined when nothing is found', async () => {
    await expect(resolve('missing')).resolves.toBeUndefined();
  });

  test('runs .cmd files through cmd.exe with escaped arguments', async () => {
    const spaced = path.join(dir, 'my bin');
    await fs.mkdir(spaced);
    await fs.writeFile(path.join(spaced, 'npm.CMD'), '');

    const spawn = await toWindowsSpawn({
      command: 'npm',
      args: ['run', 'a&b'],
      cwd: dir,
      env: {PATH: spaced, PATHEXT: '.CMD', ComSpec: 'C:\\Windows\\cmd.exe'},
    });

    expect(spawn).toMatchObject({
      file: 'C:\\Windows\\cmd.exe',
      verbatim: true,
    });
    expect(spawn.args.slice(0, 3)).toEqual(['/d', '/s', '/c']);
    // the space in the shim's path is escaped too
    expect(spawn.args[3]).toMatch(
      /my\^ bin[\\/]npm\.CMD \^"run\^" \^"a\^&b\^""$/,
    );
    expect(spawn.args[3]?.startsWith('"')).toBe(true);
  });

  test('rejects arguments with line breaks for .cmd files', async () => {
    await expect(
      toWindowsSpawn({
        command: 'npm',
        args: ['run', 'build\n--force'],
        cwd: dir,
        env: {PATH: bin, PATHEXT: '.CMD'},
      }),
    ).rejects.toThrow("can't contain line breaks");
  });

  test('spawns .exe files directly', async () => {
    await expect(
      toWindowsSpawn({
        command: 'git',
        args: ['commit', '-m', 'a&b'],
        cwd: dir,
        env: {PATH: other, PATHEXT: '.EXE'},
      }),
    ).resolves.toEqual({
      file: path.join(other, 'git.EXE'),
      args: ['commit', '-m', 'a&b'],
      verbatim: false,
    });
  });
});

describe.runIf(process.platform === 'win32')('exec on Windows', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'buildscaffold-'));
  });

  afterEach(async () => {
    await fs.rm(dir, {recursive: true, force: true});
  });

  test('runs npm, which is a .cmd shim', async () => {
    await expect(
      exec('npm', ['--version']).run({directory: dir, diff: new Map()}),
    ).resolves.toBeUndefined();
  });

  test('passes arguments to a .cmd file without letting them run commands', async () => {
    await fs.writeFile(
      path.join(dir, 'args.cmd'),
      '@echo off\r\necho %*> "%~dp0args.txt"\r\n',
    );
    await exec('./args', ['a & echo injected> injected.txt', '100%']).run({
      directory: dir,
      diff: new Map(),
    });
    await expect(
      fs.readFile(path.join(dir, 'args.txt'), 'utf8'),
    ).resolves.toContain('a & echo injected> injected.txt');
    await expect(fs.stat(path.join(dir, 'injected.txt'))).rejects.toThrow();
  });
});
