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

A task is a function which receives the directory the changes were applied to and the changes themselves, so it can skip itself when nothing it depends on changed:

```ts
import {type Task, npm} from '@buildscaffold/task';

const installWhenNeeded: Task = async (ctx) => {
  if (ctx.diff.has('package.json')) await npm.install()(ctx);
};
```

- `Task` - `(ctx: TaskContext) => Promise<void>`
- `TaskContext` - `{cwd, diff}`, where `diff` is the [`Diff`](../core#diff) which was applied
- `serial(tasks)` - run tasks one after another, skipping the rest when one fails
- `parallel(tasks)` - run tasks at the same time. When one fails, the others finish before the failure is thrown (an `AggregateError` when several fail)
- `exec(cmd, args, {cwd?})` - run a command, showing its output. `cwd` is relative to the scaffolded directory
- `npm.install({cwd?})` and `npm.run(script, {cwd?})`
- `git.init({cwd?})`, `git.add({cwd?})`, `git.commit(message, {cwd?})`, `git.addRemote({name, url, cwd?})` and `git.push({remote?, cwd?})`

Commands are run without a shell, so on Windows, commands which are `.cmd` shims, such as `npm`, can't be run yet.
