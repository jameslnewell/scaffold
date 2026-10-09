# Agent instructions

`scaffold` is a CLI and framework for codifying project boilerplate and generating new codebases from it. See [README.md](README.md).

## Layout

This is a pnpm workspace of `@buildscaffold/*` packages:

- [`packages/core`](packages/core) - file trees (`/files`), diffing and applying them (`/diff`), and composable scaffolds (root). No third-party dependencies
- [`packages/ejs`](packages/ejs) - EJS templates
- [`packages/task`](packages/task) - tasks which run after the changes are applied. No third-party dependencies
- [`packages/github-task`](packages/github-task) - GitHub tasks
- [`packages/cli`](packages/cli) - the `scaffold` command, and `defineScaffold()` for scaffold modules (`/define`)
- [`examples/*`](examples) - private, runnable example scaffolds

## Commands

Run from the repository root:

- `pnpm install`
- `pnpm run check:formatting` (`pnpm run fix:formatting` to fix)
- `pnpm run check:linting` (`pnpm run fix:linting` to fix)
- `pnpm run check:typing`
- `pnpm run test`
- `pnpm run build`

For a manual end-to-end check, run `pnpm run example` from `examples/greeting` after building. It writes to the git-ignored `examples/greeting/tmp/greeting`.

## Conventions

- ESM: use `.js` extensions in relative imports from TypeScript source
- Unit tests live next to the source as `*.test.ts`
- Export new public helpers from the package's entry point (e.g. `src/index.ts`) and document them in the package's `README.md`
- Follow the "Adding a package" checklist in [CONTRIBUTING.md](CONTRIBUTING.md) for new packages
- Format with prettier (`pnpm run fix:formatting`) rather than by hand
