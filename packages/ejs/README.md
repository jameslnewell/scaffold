# @buildscaffold/ejs

Render [EJS](https://ejs.co/) templates with [`@buildscaffold/core`](../core).

```console
npm install @buildscaffold/core @buildscaffold/ejs
```

Each file ending in `.ejs` is rendered as a template and has its `.ejs` extension removed, e.g. `package.json.ejs` becomes `package.json`. Other files, like images, are left as they are.

Values output with `<%= %>` aren't HTML escaped, since templates are usually code and config rather than HTML. Templates loaded from disk can `include()` other templates relative to themselves, and rendered files keep their template's mode, so an executable template renders an executable file.

## Scaffold

```ts
import {pipe, write} from '@buildscaffold/core';
import {template} from '@buildscaffold/ejs';

const scaffold = pipe(
  template(new URL('../templates', import.meta.url), {name: 'my-package'}),
  write('greeting.txt', 'Hello!'),
);
```

- `template(tree, data, {to?})` - render the templates in a directory (a path or `URL`), a tree, or a promise of a tree, and merge them into the destination, optionally into the `to` directory. Existing files with the same path are replaced

## Files

```ts
import {fromDisk} from '@buildscaffold/core/files';
import {template} from '@buildscaffold/ejs/files';

const rendered = await template(await fromDisk('./templates'), {
  name: 'my-package',
});
```

- `template(files, data)` - a new tree with each `.ejs` file rendered
