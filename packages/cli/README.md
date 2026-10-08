# @buildscaffold/cli

The `scaffold` command, for running scaffolds built with [`@buildscaffold/core`](../core), and `defineScaffold()` for writing scaffold modules.

Requires Node.js 24 or later.

## Running a scaffold

Use `npm x` to install and run the CLI along with a package of scaffolds:

```console
npm x -p @buildscaffold/cli -p some-scaffold-package -- \
  scaffold some-scaffold-package/some-scaffold -- --some-option value
```

Or run a scaffold module on your machine:

```console
npm x -p @buildscaffold/cli -- scaffold ./path/to/some-scaffold.js -- --some-option value
```

The module is resolved from the current directory (or `--cwd`) the same way an `import` would be, so it must be exposed through its package's `exports` or be referenced with its file extension.

```console
scaffold <module> [--cwd <directory>] [--apply | --no-apply] -- [scaffold options]
```

- `<module>` - the scaffold module to run, e.g. `some-scaffold-package/some-scaffold` or `./some-scaffold.js`
- `--cwd` - the directory to scaffold, defaults to the current directory
- `--apply` - apply the changes and run the tasks without asking, or `--no-apply` to only preview the changes
- `-- [scaffold options]` - the scaffold's options, e.g. `-- --name Bob`. Missing required options are prompted for when the terminal is interactive

The scaffold runs over an in-memory copy of the directory and the changes are printed. Nothing is written until you confirm or pass `--apply`. Then the changes are written and the scaffold's tasks are run. When there are no changes, you're still asked whether to run the tasks. If the scaffold fails, nothing is written, and if the scaffold or a task fails, the CLI exits with code 1.

## Writing a scaffold module

A scaffold module's default export is created with `defineScaffold()`:

```ts
import {defineScaffold} from '@buildscaffold/cli/define';
import {write} from '@buildscaffold/core';
import {git} from '@buildscaffold/task';

export default defineScaffold({
  options: {
    name: {type: 'string', description: 'Who to greet'},
    shout: {type: 'boolean', description: 'Whether to shout', optional: true},
  },
  scaffold: ({name, shout}) =>
    write(
      'greeting.txt',
      shout ? `HELLO ${name.toUpperCase()}!` : `Hello ${name}!`,
    ),
  tasks: () => git.init(),
});
```

- `options` - the options the scaffold accepts, each of which becomes a `--<name>` flag. The values passed to `scaffold` and `tasks` are typed from them
  - `type` - `string`, `number`, `boolean` or `choice` (with `choices`)
  - `description` - shown in the CLI's help and when prompting
  - `optional` - whether the option can be omitted, defaults to `false`
  - `array` - whether the option accepts several values, e.g. `--tag a --tag b`
- `scaffold` - a `ScaffoldFactory`, which creates the [scaffold](../core#scaffolds) from the option values
- `tasks` - an optional `TasksFactory`, which creates the [task](../task) to run after the changes have been applied

`@buildscaffold/cli/define` only contains types and `defineScaffold()`, so importing it doesn't load the CLI.

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
mkdir -p ./tmp/my-package
npx scaffold "$PWD/dist/create.js" --cwd ./tmp/my-package -- --name my-package
```

Relative module paths are resolved from `--cwd`, so use an absolute path when `--cwd` points elsewhere.
