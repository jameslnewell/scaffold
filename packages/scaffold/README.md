# @jameslnewell/scaffold

A framework for writing generators to scaffold out new projects.

## Usage
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

## Authoring a scaffold

A scaffold is just a function which modifies a set of files and optionally queues tasks to run after the files are written.

```ts
import {ScaffoldFactory, ScaffoldPrompts, ScaffoldOptions, chain, file, queueTask, exec} from '@jameslnewell/scaffold'

export const prompts = {
  name: {
    type: 'string',
    description: 'The name of the person or animal to greet'
  }
} satisfies ScaffoldPrompts

export const factory: ScaffoldFactory<ScaffoldOptions<typeof prompts>> = ({name}) => {
  return chain([
    file.write('greeting.txt', `Hello ${name}!`),
    queueTask(exec('cat', ['greeting.txt'])),
  ])
}
```

The package exports these helpers:

- scaffolds: `chain`, `queueTask`, `file` (`write`, `copy`, `move`, `rm`, `template`) and `json` (`merge`, `transform`)
- tasks: `exec`, `serial`, `parallel`, `npm`, `git` and `github`
