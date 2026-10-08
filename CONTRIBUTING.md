# Contributing

This repository is a [pnpm workspace](https://pnpm.io/workspaces) with packages located under `packages/*`.

Use the pnpm version pinned in the root `package.json` `packageManager` field (e.g. via `corepack enable`).

## Installation

```console
pnpm install
```

## Testing

Unit testing (all packages):
```console
pnpm run test
```

Manual testing:
```console
cd packages/scaffold
pnpm run build
pnpm run example:greeting
```
