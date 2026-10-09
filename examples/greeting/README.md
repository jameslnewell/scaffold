# Example: greeting

A scaffold in a single module, [`src/greeting.ts`](src/greeting.ts), which only imports from `@buildscaffold/core`'s root entry point. It merges in the files from [`files`](files) (including an executable script, which stays executable), writes a greeting and a `package.json`, writes a `README.md` when there isn't one, then runs `npm install` and `git init`. Its tests check the scaffold, its task tree, and which tasks would run.

Run it from this directory, after building the workspace with `pnpm run build` from the repository root:

```console
pnpm run example
```

It writes to `tmp/greeting`, which is git ignored. `git init` is skipped there, since `tmp/greeting` is already inside this repository. Run it again to see that there's nothing to do: there are no changes, so `npm install` is skipped too.
