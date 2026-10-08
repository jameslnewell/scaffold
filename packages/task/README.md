# @buildscaffold/task

Run side effects, like `npm install` and `git init`, after a scaffold's changes have been applied.

Requires Node.js 24 or later. Has no third-party dependencies.

```console
npm install @buildscaffold/core @buildscaffold/task
```

## Usage

```ts
import {git, npm, serial} from '@buildscaffold/task';

const tasks = serial([npm.install(), git.init(), git.add()]);
```

Tasks are plain objects, so a scaffold's tasks can be inspected and tested without running them. There are two kinds:

- collections, `serial(tasks)` and `parallel(tasks)`, which only say how their children run
- function tasks, which do the work. Each has a `label` shown before it runs, optional `params` describing what it will do (for tests), an optional `when` that decides whether it runs, and `run`

A task receives the directory the changes were applied to and the changes themselves, so a `when` can skip a task when nothing it depends on changed:

```ts
import type {FunctionTask} from '@buildscaffold/task';

const greet: FunctionTask = {
  type: 'function',
  label: 'say hello',
  when: ({diff}) => diff.has('greeting.txt'),
  run: async () => console.log('Hello!'),
};
```

- `Task` - `SerialTasks | ParallelTasks | FunctionTask`
- `TaskContext` - `{directory, diff}`, where `diff` is the [`Diff`](../core#diff) which was applied
- `serial(tasks)` - run tasks one after another, skipping the rest when one fails
- `parallel(tasks)` - run tasks at the same time. When one fails, the others finish before the failure is thrown (an `AggregateError` when several fail)
- `exec(command, args, {cwd?, when?})` - run a command, showing its output. `cwd` is relative to the scaffolded directory, and the label is the command, e.g. `npx prettier --write .`
- `npm.install({cwd?})` - run `npm install`, only when `package.json` changed
- `npm.run(script, {cwd?})` - run a script with `npm run`
- `git.init({cwd?})` - run `git init`, only when the directory isn't already inside a git repository, so a new package in a monorepo doesn't get a repository of its own
- `git.add({cwd?})`, `git.commit(message, {cwd?})`, `git.addRemote({name, url, cwd?})` and `git.push({remote?, cwd?})`
- `runTask(task, ctx)` - run a task, skipping function tasks whose `when` is false
- `planTasks(task, ctx)` - the tasks which would run, without running them, or `undefined` when nothing would run. Skipped function tasks and collections left empty are removed. Every `when` is evaluated up front, before any task runs, so a condition can't depend on what an earlier task does
- `labelsOf(task)` - the labels of the function tasks, in the order they'd start

Commands are run without a shell, so on Windows, commands which are `.cmd` shims, such as `npm`, can't be run yet.

## Testing your tasks

Because tasks are plain objects, you can check them with your test runner's matchers, and use `planTasks` to check which would run for a set of changes:

```ts
const tasks = serial([npm.install(), git.init()]);

expect(tasks).toMatchObject({
  type: 'serial',
  tasks: [
    {label: 'npm install', params: {command: 'npm', args: ['install']}},
    {label: 'git init', params: {command: 'git', args: ['init']}},
  ],
});

// package.json didn't change, so npm install would skip itself
const plan = await planTasks(tasks, {
  directory: '/tmp/empty',
  diff: new Map([
    ['greeting.txt', {type: 'create', content: new Uint8Array()}],
  ]),
});
expect(plan).toMatchObject({type: 'serial', tasks: [{label: 'git init'}]});
```
