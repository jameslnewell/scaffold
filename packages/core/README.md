# @buildscaffold/core

Build file trees with composable scaffolds, then diff and apply them to disk.

A scaffold is a function from one file tree to another. It receives the destination tree, a lazily loaded, read-only view of the disk, and returns the tree it should become. Nothing is written until the changes are applied.

Requires Node.js 24 or later. Has no third-party dependencies.

```console
npm install @buildscaffold/core
```

## Entry points

- `@buildscaffold/core` - the `Scaffold` type
- `@buildscaffold/core/files` - file trees and the operations on them
- `@buildscaffold/core/diff` - comparing trees and applying the changes to disk

## Files

`Files` is an immutable tree of files keyed by relative POSIX paths, e.g. `src/index.ts`. It works like a `Map`, except that `set` and `delete` return a new tree. Files are shared by reference, so copying one is cheap. Directories are implied by the files in them, so empty directories can't be represented.

```ts
import {fromDisk, readText, writeText} from '@buildscaffold/core/files';

let files = await fromDisk('./my-project');
files = writeText(files, 'greeting.txt', 'Hello!');
files.has('greeting.txt'); // true
await readText(files, 'greeting.txt'); // 'Hello!'

// copy a file without reading it
const greeting = files.get('greeting.txt');
if (greeting) files = files.set('copy.txt', greeting);
```

- `new Files(entries?)` - a tree from `[path, file]` entries
- `files.has(path)`, `files.get(path)`, `files.keys()`, `files.values()`, `files.entries()` and `files.size`, and iterating over `[path, file]`, read the tree in path order. `get` returns the `File` without reading it, and `files.get(path)?.bytes()` reads its bytes
- `files.set(path, file)` and `files.delete(path)` return a changed tree
- `fromDisk(dir, {glob?, ignore?})` - load a tree from a directory, given as a path or a `URL`. Paths are listed straight away but files are only read when needed. Dotfiles are loaded (and `*` and `**` match them), `**/.git/**` and `**/node_modules/**` are ignored unless `ignore` replaces them, symbolic links are skipped, and a missing directory loads as an empty tree
- `readText(files, path)` - read a file as UTF-8 text, or `undefined` when there is none
- `writeText(files, path, text, {mode?})` - write a file as UTF-8 text. This is the only way to set a mode. Without one, a new file gets the default mode and an existing file keeps its mode on disk

### File

Each file in a tree is a `File`, an interface with `bytes()` and `stat()` (its `size` and optional `mode`). Files loaded by `fromDisk` are only read the first time they're needed, share that read with every tree that holds them, and report their mode on disk. Implement `File` for other sources of files, and add one to a tree with `files.set(path, file)`. A mode reported by your own implementation is ignored, since `writeText` is the only way to set one.

## Diff

```ts
import {apply, diff} from '@buildscaffold/core/diff';
import {fromDisk} from '@buildscaffold/core/files';

const before = await fromDisk(dir);
const after = await scaffold(before);
const changes = await diff(before, after);
for (const [file, {type}] of changes) console.log(type, file);
await apply(dir, changes);
```

- `diff(before, after)` - a `Map` of each changed path to a `create`, `modify` or `delete`. A file is modified when its bytes or its mode change, so a file which is rewritten with identical bytes isn't reported
- `apply(dir, diff)` - write the changes to a directory, creating it when it doesn't exist and deleting any directories left empty. To write a whole tree to an empty directory, use `apply(dir, await diff(new Files(), files))`

Only files that were replaced are read to compare them, and files loaded from disk are copied natively rather than read into memory (unless the file they're copied from is itself being changed, e.g. when swapping two files), so large directories and files are cheap to diff and apply. Only files that `fromDisk` loaded can be deleted, so ignored files are never touched.

Modes are kept, so executable files like `bin` scripts and git hooks stay executable. A file loaded from disk keeps its mode, including when it's copied or moved to another path, a file written by `writeText` with a `mode` gets it, and `diff` reports a change in mode alone as a modify. A file written without a mode gets the default mode when it's created and keeps its mode when it's modified. On Windows, modes are neither applied nor compared.
