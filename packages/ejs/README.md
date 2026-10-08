# @buildscaffold/ejs

Render [EJS](https://ejs.co/) templates with [`@buildscaffold/core`](../core).

```console
npm install @buildscaffold/core @buildscaffold/ejs
```

Each file ending in `.ejs` is rendered as a template and has its `.ejs` extension removed, e.g. `package.json.ejs` becomes `package.json`. Other files, like images, are left as they are.

Values output with `<%= %>` aren't HTML escaped, since templates are usually code and config rather than HTML. Templates loaded from disk can `include()` other templates relative to themselves.

## Scaffold

```ts
import {pipe} from '@buildscaffold/core';
import {fromDisk} from '@buildscaffold/core/files';
import {template} from '@buildscaffold/ejs';

const scaffold = pipe(
  template(fromDisk(`${import.meta.dirname}/templates`), {name: 'my-package'}),
);
```

- `template(tree, data, {to?})` - render a tree (or a promise of one, like `fromDisk(...)`) and merge it into the destination, optionally into the `to` directory

## Files

```ts
import {fromDisk} from '@buildscaffold/core/files';
import {template} from '@buildscaffold/ejs/files';

const rendered = await template(await fromDisk('./templates'), {
  name: 'my-package',
});
```

- `template(files, data)` - a new tree with each `.ejs` file rendered
