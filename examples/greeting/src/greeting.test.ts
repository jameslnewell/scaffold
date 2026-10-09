import {Files, readText, writeText} from '@buildscaffold/core/files';
import {describe, expect, test} from 'vitest';
import {diff} from '@buildscaffold/core/diff';
import greeting from './greeting.js';
import {planTasks} from '@buildscaffold/task';

describe('greeting', () => {
  test('greets by name', async () => {
    const files = await greeting.scaffold({name: 'Bob'})(new Files());
    expect([...files.keys()]).toEqual([
      'LICENSE.txt',
      'README.md',
      'bin/greet.sh',
      'greeting.txt',
      'package.json',
    ]);
    await expect(readText(files, 'greeting.txt')).resolves.toBe('Hello Bob!');
  });

  test('keeps an existing README', async () => {
    const existing = await writeText(new Files(), 'README.md', '# Mine');
    const files = await greeting.scaffold({name: 'Bob'})(existing);
    await expect(readText(files, 'README.md')).resolves.toBe('# Mine');
  });

  const tasks = greeting.tasks?.({
    options: {name: 'Bob'},
    directory: '/tmp/greeting',
  });

  test('installs dependencies and initialises a git repository', () => {
    expect(tasks).toMatchObject({
      type: 'serial',
      tasks: [
        {label: 'npm install', params: {command: 'npm', args: ['install']}},
        {label: 'git init', params: {command: 'git', args: ['init']}},
      ],
    });
  });

  test.each<[string, string, string[]]>([
    ['with', 'package.json', ['npm install', 'git init']],
    ['without', 'greeting.txt', ['git init']],
  ])('plans the tasks for changes %s package.json', async (_, file, labels) => {
    if (tasks === undefined) throw new Error('expected tasks');
    const before = new Files();
    const plan = await planTasks(tasks, {
      directory: '/tmp/buildscaffold-missing',
      diff: await diff(before, await writeText(before, file, '')),
    });
    expect(plan).toMatchObject({
      type: 'serial',
      tasks: labels.map((label) => ({label})),
    });
  });
});
