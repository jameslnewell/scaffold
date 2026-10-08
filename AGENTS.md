# Agent instructions

`scaffold` is a CLI and framework for codifying project boilerplate and generating new codebases from it. See [README.md](README.md).

## Layout

This is a pnpm workspace with a single package, [`packages/scaffold`](packages/scaffold):

- `src/cli.ts` - the `scaffold` CLI
- `src/lib.ts` - the public API
- `src/scaffolds/*` - helpers which change files (staged in memory until applied)
- `src/tasks/*` - helpers for side effects which run after the changes are applied
- `src/examples/*` - runnable example scaffolds (excluded from the published package)

## Commands

Run from the repository root:

- `pnpm install`
- `pnpm run check:typing`
- `pnpm run test`
- `pnpm run build`

For a manual end-to-end check, run `pnpm run example:greeting` from `packages/scaffold` after building. It writes to the git-ignored `packages/scaffold/tmp/greeting`.

## Conventions

- ESM: use `.js` extensions in relative imports from TypeScript source
- Unit tests live next to the source as `*.test.ts`
- Export new public helpers from `src/lib.ts` and document them in [`packages/scaffold/README.md`](packages/scaffold/README.md)
- There is no formatter, so match the surrounding formatting and keep diffs minimal
