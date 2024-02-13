# @jameslnewell/scaffold

## Usage
Use `npm x` to install and run the _latest_ version of the `scaffold` CLI.

Install and run a scaffold published on NPM:
```console
npm x \
  -p @jameslnewell/scaffold \
  -p some-scaffold-package \
  scaffold \
    some-scaffold/some-scaffold-module \
    --apply \
    -- \
    --foo=bar
```

Run a scaffold located on your local machine:
```console
npm x \
  -p @jameslnewell/scaffold \
  scaffold \
    --apply \
    /path/to/some-scaffold/some-scaffold-module \
    -- \
    --foo=bar
```

## Authoring a scaffold

A scaffold is just a function which modifies a set of files.

```ts
import {Factory, Prompts, Options} from '@jameslnewell/scaffold'

export const options = {
  name: {
    type: 'string',
    description: 'The name of the person or animal to greet'
  }
} satisfies Prompts

export const scaffold: Factory<Options<typeof options>> = ({name}) => {
  return (files, tasks) => {
    files.write('greeting.txt', `Hello ${name}!`)
  }
}
```

