# Example: node-package

A package of scaffolds for creating and maintaining Node.js packages:

- [`./create`](src/create.ts) - create a package from [EJS](https://ejs.co/) templates, with a license, then initialise a git repository
- [`./add-license`](src/add-license.ts) - add a license to an existing package

The scaffolds share code ([`src/license.ts`](src/license.ts)) and are exposed through the `exports` in [`package.json`](package.json). The package depends on the `@buildscaffold/*` packages it uses, and lists `@buildscaffold/cli` as a peer dependency, since the CLI is installed alongside it.

## Usage

This example is private, but if it were published, its scaffolds would be run with `npm x`:

```console
npm x -p @buildscaffold/cli -p @buildscaffold/example-node-package -- \
  scaffold @buildscaffold/example-node-package/create --name my-package --author "James Newell"
```

In this repository, run them from this directory after building the workspace with `pnpm run build` from the repository root:

```console
pnpm run example:list
pnpm run example:create
pnpm run example:add-license
```

`example:list` lists the package's scaffolds. The others write to `tmp/my-package`, which is git ignored.
