# scaffold

> **scaffold**
>
> _verb_ — To erect a scaffold; to provide a supporting framework from which something can be built.
>
> _noun_ — A temporary framework erected to support workers and materials during the construction or repair of a structure.

_Scaffold_ applies this idea to software. It is a CLI and framework for codifying project boilerplate and generating new codebases from it. A scaffold provides the initial structure, and the codebase it produces is then maintained independently of it.

## Usage

Scaffolds are run with the `scaffold` CLI, typically via `npm x`:

```console
npm x -p @buildscaffold/cli -p some-scaffold-package -- \
  scaffold some-scaffold-package/some-scaffold --some-option value
```

Run `scaffold some-scaffold-package` to list the scaffolds a package provides, and `scaffold some-scaffold-package/some-scaffold --help` to see a scaffold's options. See [`@buildscaffold/cli`](packages/cli) for the CLI's flags.

## Writing a scaffold

A scaffold is a function from one file tree to another. A scaffold module defines its options, the scaffold, and any tasks to run once the changes have been applied:

```ts
import {defineScaffold} from '@buildscaffold/cli/define';
import {json, merge, pipe, when, write} from '@buildscaffold/core';
import {git, npm, serial} from '@buildscaffold/task';

export default defineScaffold({
  description: 'Greets someone by name',
  options: {name: {type: 'string', description: 'Who to greet'}},
  scaffold: ({name}) =>
    pipe(
      merge(new URL('../files', import.meta.url)),
      write('greeting.txt', `Hello ${name}!`),
      json.merge('package.json', {name: 'greeting', private: true}),
      when(
        (files) => !files.has('README.md'),
        write('README.md', `# Greeting for ${name}\n`),
      ),
    ),
  tasks: () => serial([npm.install(), git.init()]),
});
```

See the [examples](examples) for scaffolds you can run, and [`@buildscaffold/cli`](packages/cli#writing-a-scaffold-module) for publishing a package of scaffolds.

## How it works

When you run a scaffold, the `scaffold` CLI:

1. loads the scaffold module from an npm package or a local file
2. reads the scaffold's options from the command line arguments, prompting for any which are missing
3. loads the output directory as a file tree, without reading the contents of the files, runs the scaffold over it, and prints the changes and the tasks which will run, e.g. `npm install` or `git init`, so nothing is written yet
4. writes the changes to disk once you confirm (or pass `--apply`), then runs the tasks

Because the tree is only read when a scaffold needs a file's content, and unchanged files are copied rather than read, scaffolds stay fast in large directories. Files copied from disk keep their modes, so executable files stay executable. Tasks skip themselves when nothing they depend on changed, e.g. `npm install` only runs when `package.json` changed, so running a scaffold again over its own output has nothing to do.

## Packages

- [`@buildscaffold/core`](packages/core) - file trees, composable scaffolds, and diffing and applying changes. No third-party dependencies
- [`@buildscaffold/ejs`](packages/ejs) - render [EJS](https://ejs.co/) templates
- [`@buildscaffold/task`](packages/task) - tasks like `npm install` and `git init`. No third-party dependencies
- [`@buildscaffold/github-task`](packages/github-task) - tasks for creating and configuring GitHub repositories
- [`@buildscaffold/cli`](packages/cli) - the `scaffold` command, and `defineScaffold()` for scaffold modules

See [CONTRIBUTING.md](CONTRIBUTING.md) for developing in this repository.
