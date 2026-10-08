# scaffold

> **scaffold**
>
> _noun_ — A temporary framework erected to support workers and materials during the construction or repair of a structure.
>
> _verb_ — To erect a scaffold; to provide a supporting framework from which something can be built.

_Scaffold_ applies this idea to software. It is a CLI and a set of utilities for codifying project boilerplate as reusable scaffolds, then using them to generate new codebases. A scaffold provides the initial structure, and the codebase it produces is then maintained independently of it.

## How it works

When you run a scaffold, the `scaffold` CLI:

1. loads the scaffold module, which declares its `prompts` and a `factory`, from an npm package or a local file
2. reads the scaffold's options from the command line arguments
3. runs the scaffold against an in-memory copy of the target directory and prints a diff of the changes, so nothing is written yet
4. writes the changes to disk once you confirm (or pass `--apply`), then runs any queued tasks, e.g. `npm install` or `git init`

## Usage

Scaffolds are run with the `scaffold` CLI, typically via `npm x`. See [scaffolding a project](packages/scaffold/README.md#scaffolding-a-project).

## Writing a scaffold

A scaffold is an ES module that exports its `prompts` and a `factory` function. The factory composes the helpers from `@jameslnewell/scaffold`. See [writing a scaffold](packages/scaffold/README.md#writing-a-scaffold).

## Packages

- [`@jameslnewell/scaffold`](packages/scaffold) - the `scaffold` CLI and utilities for writing scaffolds

See [CONTRIBUTING.md](CONTRIBUTING.md) for developing in this repository.
