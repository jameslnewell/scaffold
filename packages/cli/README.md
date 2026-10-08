# @buildscaffold/cli

The `scaffold` command, for running scaffolds built with [`@buildscaffold/core`](../core), and `defineScaffold()` for writing scaffold modules.

Requires Node.js 24 or later.

## Running a scaffold

Use `npm x` to install and run the CLI along with a package of scaffolds:

```console
npm x -p @buildscaffold/cli -p some-scaffold-package -- \
  scaffold some-scaffold-package/some-scaffold --some-option value
```

Or run a scaffold module on your machine:

```console
npm x -p @buildscaffold/cli -- scaffold ./path/to/some-scaffold.js --some-option value
```

```console
scaffold <module> [--output-directory <directory>] [--apply | --no-apply] [--no-tasks] [scaffold options]
```

- `<module>` - the scaffold module to run, e.g. `some-scaffold-package/some-scaffold` or `./some-scaffold.js`. Relative paths are resolved from the current directory, and other IDs the same way an `import` would be, so a scaffold must be exposed through its package's `exports`
- `--output-directory` - the directory to scaffold into, defaults to the current directory
- `--apply` - apply the changes and run the tasks without asking, or `--no-apply` to only preview them
- `--no-tasks` - apply the changes without running the scaffold's tasks
- `--help` - show the scaffold's description and options
- scaffold options - the scaffold's options, e.g. `--name Bob`, after the module. Missing required options are prompted for when the terminal is interactive

Run `scaffold <package>` without a module to list the scaffolds a package exports, e.g. `scaffold some-scaffold-package`.

The scaffold runs over an in-memory copy of the directory, then the changes and the tasks which will run are printed. Nothing is written until you confirm or pass `--apply`. Then the changes are written and the tasks are run. When there are no changes and no tasks to run, the CLI prints `Nothing to do.` without asking. If the scaffold fails, nothing is written, and if the scaffold or a task fails, the CLI exits with code 1. You're warned before applying changes to a git repository with uncommitted changes, since they can't easily be undone.

## Writing a scaffold module

A scaffold module's default export is created with `defineScaffold()`:

```ts
import {defineScaffold} from '@buildscaffold/cli/define';
import {write} from '@buildscaffold/core';
import {git} from '@buildscaffold/task';

export default defineScaffold({
  description: 'Writes a greeting',
  options: {
    name: {type: 'string', description: 'Who to greet'},
    shout: {type: 'boolean', description: 'Whether to shout', optional: true},
  },
  scaffold: ({name, shout}) =>
    write(
      'greeting.txt',
      shout ? `HELLO ${name.toUpperCase()}!` : `Hello ${name}!`,
    ),
  tasks: ({options, directory}) => git.init(),
});
```

- `description` - what the scaffold does, shown in `--help` and when listing a package's scaffolds
- `options` - the options the scaffold accepts, each of which becomes a `--<name>` flag. The values passed to `scaffold` and `tasks` are typed from them
  - `type` - `string`, `number`, `boolean` or `choice` (with `choices`)
  - `description` - shown in the CLI's help and when prompting
  - `optional` - whether the option can be omitted, defaults to `false`
  - `array` - whether the option accepts several values, e.g. `--tag a --tag b`
  - names the CLI uses for its own flags (`help`, `version`, `apply`, `tasks` and `output-directory`) can't be used
- `scaffold` - a `ScaffoldFactory`, which creates the [scaffold](../core#scaffolds) from the option values
- `tasks` - an optional `TasksFactory`, which receives `{options, directory}` and creates the [task](../task) to run after the changes have been applied. It isn't called with `--no-tasks`

`@buildscaffold/cli/define` only contains types and `defineScaffold()`, so importing it doesn't load the CLI. `defineScaffold()` marks the module, so the CLI can tell which of a package's exports are scaffolds.

### Publishing a package of scaffolds

Expose each scaffold module through your package's `exports`, depend on the `@buildscaffold/*` packages your scaffolds use, and list `@buildscaffold/cli` as a peer dependency, since it is installed alongside your package:

```json
{
  "name": "some-scaffold-package",
  "type": "module",
  "exports": {
    "./create": "./dist/create.js"
  },
  "dependencies": {
    "@buildscaffold/core": "^0.1.0"
  },
  "peerDependencies": {
    "@buildscaffold/cli": "^0.1.0"
  }
}
```

See [`examples/node-package`](../../examples/node-package) for a complete example.

### Trying your scaffold

Run your scaffold module against an empty directory, without `--apply`, to preview its changes:

```console
npx scaffold ./dist/create.js --output-directory ./tmp/my-package --name my-package
```
