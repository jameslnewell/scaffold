# Contributing

This repository is a [pnpm workspace](https://pnpm.io/workspaces) with packages located under `packages/*` and private example packages under `examples/*`.

Use the Node.js version in `.nvmrc` (e.g. via `nvm use`) and the pnpm version pinned in the root `package.json` `packageManager` field (e.g. via `corepack enable`).

## Installation

```console
pnpm install
```

## Formatting

```console
pnpm run check:formatting
pnpm run fix:formatting
```

## Linting

```console
pnpm run check:linting
pnpm run fix:linting
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

The greeting example writes files, runs `npm install` and initialises a git repository in `packages/scaffold/tmp/greeting` which is git ignored.

## Adding a package

Packages are published under the `@buildscaffold` scope. When adding one under `packages/*` (or an example under `examples/*`):

- [ ] `package.json` has:
  - `"type": "module"` and `"engines": {"node": ">=24"}`
  - `exports` with the `@buildscaffold/source` condition first, so other workspace packages use the TypeScript source without a build:
    ```json
    "exports": {
      ".": {
        "@buildscaffold/source": "./src/index.ts",
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      }
    }
    ```
  - `"files": ["dist"]`, or `"private": true` for examples
  - the standard scripts:
    ```json
    "scripts": {
      "build": "rm -rf ./dist && tsc -p tsconfig.build.json",
      "check:linting": "eslint .",
      "check:typing": "tsc",
      "fix:linting": "eslint --fix .",
      "test": "vitest run --project unit"
    }
    ```
  - the `devDependencies` those scripts use, with the same specifiers as [`packages/scaffold/package.json`](packages/scaffold/package.json): `@jameslnewell/eslint-config`, `@jameslnewell/vitest-config`, `@types/node`, `eslint`, `vite`, `vitest`, and the two aliased TypeScript versions (`"@typescript/native": "npm:typescript@…"` provides `tsc`, and `"typescript": "npm:@typescript/typescript6@…"` is used by `typescript-eslint`)
- [ ] `tsconfig.json` extends `../../tsconfig.base.json`, which enables the `@buildscaffold/source` condition, and `tsconfig.build.json` extends `tsconfig.json`
- [ ] `eslint.config.mjs` resolves imports with the `@buildscaffold/source` condition, so `import/no-unresolved` doesn't need other packages to be built:
  ```js
  import {defineConfig, globalIgnores} from 'eslint/config';
  import config from '@jameslnewell/eslint-config/node';

  export default defineConfig([
    globalIgnores(['dist']),
    config,
    {
      settings: {
        'import/resolver': {
          typescript: {
            conditionNames: [
              '@buildscaffold/source',
              'types',
              'import',
              'require',
              'node',
              'default',
            ],
          },
        },
      },
    },
  ]);
  ```
- [ ] `vitest.config.mjs` enables the `@buildscaffold/source` condition, so tests import other workspace packages from source (Vitest runs Node tests in Vite's SSR environment, which reads `ssr.resolve.conditions`, and adds its own default conditions to it):
  ```js
  import config from '@jameslnewell/vitest-config';
  import {defineConfig, mergeConfig} from 'vitest/config';

  export default mergeConfig(
    config,
    defineConfig({
      ssr: {
        resolve: {
          conditions: ['@buildscaffold/source'],
        },
      },
    }),
  );
  ```
- [ ] Other workspace packages are depended on with `workspace:*`. A package that a scaffold shares with the runner (e.g. `@buildscaffold/cli`) is a `peerDependency`, so there is only one copy at runtime.
- [ ] `@buildscaffold/core` and `@buildscaffold/task` have no third-party `dependencies`. Capabilities that need one belong in their own package, so a scaffold only installs what it uses.
