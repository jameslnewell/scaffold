import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import type {Diff} from '@buildscaffold/core/diff';
import {exec} from './exec.js';

const diff: Diff = new Map();

describe(exec, () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'buildscaffold-'));
    await fs.mkdir(path.join(dir, 'nested'));
  });

  afterEach(async () => {
    await fs.rm(dir, {recursive: true, force: true});
  });

  const writeCwd = [
    '-e',
    `require('fs').writeFileSync('cwd.txt', process.cwd())`,
  ];

  test('describes the command', () => {
    expect(exec('npm', ['run', 'build'], {cwd: 'packages/a'})).toMatchObject({
      type: 'function',
      label: 'npm run build (in packages/a)',
      params: {command: 'npm', args: ['run', 'build'], cwd: 'packages/a'},
    });
  });

  test('runs the command in the scaffolded directory', async () => {
    await exec(process.execPath, writeCwd).run({directory: dir, diff});
    await expect(fs.readFile(path.join(dir, 'cwd.txt'), 'utf8')).resolves.toBe(
      await fs.realpath(dir),
    );
  });

  test('runs the command in a directory relative to the scaffolded directory', async () => {
    await exec(process.execPath, writeCwd, {cwd: 'nested'}).run({
      directory: dir,
      diff,
    });
    await expect(
      fs.readFile(path.join(dir, 'nested', 'cwd.txt'), 'utf8'),
    ).resolves.toBe(await fs.realpath(path.join(dir, 'nested')));
  });

  test('fails when the command exits with a non-zero code', async () => {
    await expect(
      exec(process.execPath, ['-e', 'process.exit(2)']).run({
        directory: dir,
        diff,
      }),
    ).rejects.toThrow('exited with code=2');
  });

  test('fails when the command does not exist', async () => {
    await expect(
      exec('buildscaffold-missing-command', []).run({directory: dir, diff}),
    ).rejects.toThrow('ENOENT');
  });
});
