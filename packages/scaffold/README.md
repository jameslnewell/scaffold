# @jameslnewell/scaffold

> **scaffold**
>
> _noun_ — A temporary framework erected to support workers and materials during the construction or repair of a structure.
>
> _verb_ — To erect a scaffold; to provide a supporting framework from which something can be built.

A CLI and a set of utilities for codifying project boilerplate as reusable scaffolds, then using them to generate new codebases.

## Scaffolding a project

Requires Node.js 24 or later.

Use `npm x` to install and run the _latest_ version of the `scaffold` CLI.

Running a scaffold published on NPM:
```console
npm x \
  -p @jameslnewell/scaffold@latest \
  -p some-scaffold-package@latest \
  scaffold \
    some-scaffold-package/some-scaffold-module \
    --apply \
    -- \
    --some=option
```

Running a scaffold located on your local machine:
```console
npm x \
  -p @jameslnewell/scaffold@latest \
  scaffold \
    --apply \
    ./path/to/some-scaffold/some-scaffold-module.js \
    -- \
    --some=option
```

The scaffold module is resolved from the current directory (or `--cwd`) the same way an `import` would be, so a scaffold module must either be exposed through its package's `exports` or be referenced with its file extension.

### Arguments

```console
scaffold <module> [--cwd <directory>] [--apply] -- [scaffold options]
```

- `<module>` - the scaffold module to run, e.g. `some-scaffold-package/some-scaffold-module` or `./some-scaffold-module.js`
- `--cwd` - the directory to scaffold into, defaults to the current directory
- `--apply` - apply the changes without asking for confirmation
- `-- [scaffold options]` - the options declared by the scaffold's `prompts`, e.g. `-- --name Bob`

### What happens when a scaffold runs

The scaffold's changes are made to an in-memory copy of the files and a diff is printed. Nothing is written to disk until you confirm, or pass `--apply`, so you can omit `--apply` to preview the changes first. Once the changes are written, any tasks the scaffold queued (e.g. `npm install`, `git init`) are run in order.

## Writing a scaffold

A scaffold module is an ES module which exports:

- `prompts` - the options the scaffold accepts
- `factory` - a function which receives those options and returns the scaffold

```ts
import {ScaffoldFactory, ScaffoldPrompts, ScaffoldOptions, chain, file, json, queueTask, npm, git, serial} from '@jameslnewell/scaffold'

const templates = `${import.meta.dirname}/templates`

export const prompts = {
  name: {
    type: 'string',
    description: 'The name of the package'
  },
  private: {
    type: 'boolean',
    optional: true,
    description: 'Whether the package is private'
  }
} satisfies ScaffoldPrompts

export const factory: ScaffoldFactory<ScaffoldOptions<typeof prompts>> = ({name, private: isPrivate}) => {
  return chain([
    file.copy(`${templates}/license.txt`, 'license.txt'),
    file.template(`${templates}/README.md.ejs`, 'README.md', {name}),
    json.merge('package.json', {name, private: isPrivate ?? false}),
    queueTask(serial([
      npm.install(),
      git.init(),
      git.add(),
    ])),
  ])
}
```

### Prompts

Each prompt becomes a `--<name>` option on the command line, e.g. `-- --name my-package --private`.

- `type` - `string`, `number` or `boolean`
- `description` - shown in the CLI's help
- `optional` - whether the option can be omitted, defaults to `false`
- `array` - whether the option accepts multiple values, e.g. `--tag a --tag b`

Use `ScaffoldOptions<typeof prompts>` to type the options your `factory` receives.

### Scaffolds and tasks

A scaffold changes files, and those changes are only written to disk once they are applied. Paths are relative to the target directory, so reference files bundled with your scaffold by an absolute path, e.g. using `import.meta.dirname`.

A task is a side effect, such as running a command, which runs after the changes have been applied. Queue tasks from your scaffold with `queueTask()`.

Scaffolds:

- `chain(scaffolds)` - run scaffolds in order
- `queueTask(task)` - queue a task to run after the changes have been applied
- `file.write(file, content)` - write a file
- `file.copy(from, to)` - copy a file, directory or glob
- `file.move(from, to)` - move a file, directory or glob
- `file.rm(from)` - remove a file, directory or glob
- `file.template(from, to, data)` - copy a file, directory or glob, rendering each file as an [EJS](https://ejs.co/) template
- `json.merge(file, json)` - deep merge values into a JSON file
- `json.transform(file, fn)` - transform a JSON file with a function

Tasks:

- `exec(cmd, args)` - run a command
- `serial(tasks)` - run tasks one after another
- `parallel(tasks)` - run tasks at the same time
- `npm` - `install()`, `run(script)`
- `git` - `init()`, `add()`, `addRemote()`, `commit(message)`, `push()`
- `github` - `createRepo(repo)`, `addUserToRepo({repo, user, permission})`, `addTeamToRepo({repo, team, permission})` (requires a `GITHUB_TOKEN` environment variable)

### Trying your scaffold

Install `@jameslnewell/scaffold` alongside your scaffold, then run your scaffold module against an empty directory, without `--apply`, to preview its changes:

```console
npm install --save-dev @jameslnewell/scaffold
mkdir -p ./tmp/my-package
npx scaffold "$PWD/my-scaffold.js" --cwd ./tmp/my-package -- --name my-package
```

Relative module paths are resolved from `--cwd`, so use an absolute path when `--cwd` points elsewhere.
