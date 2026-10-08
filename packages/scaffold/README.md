# @jameslnewell/scaffold

A framework for writing generators to scaffold out new projects.

## Usage
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

## Authoring a scaffold

A scaffold is just a function which modifies a set of files.

```ts
import {ScaffoldFactory, ScaffoldPrompts, ScaffoldOptions} from '@jameslnewell/scaffold'

export const prompts = {
  name: {
    type: 'string',
    description: 'The name of the person or animal to greet'
  }
} satisfies ScaffoldPrompts

export const factory: ScaffoldFactory<ScaffoldOptions<typeof prompts>> = ({name}) => {
  return ({cwd, files, tasks}) => {
    files.write('greeting.txt', `Hello ${name}!`)
  }
}
```

