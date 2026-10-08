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

`Files` is an immutable tree of files keyed by relative POSIX paths, e.g. `src/index.ts`. Every change returns a new tree, and file contents are shared by reference, so copying files is cheap. Directories are implied by the files in them, so empty directories can't be represented.

```ts
import {Files, fromDisk, readText, writeText} from '@buildscaffold/core/files';

let files = await fromDisk('./my-project');
files = writeText(files, 'greeting.txt', 'Hello!');
files.has('greeting.txt'); // true
await readText(files, 'greeting.txt'); // 'Hello!'
```

- `new Files(entries?)` - a tree from `[path, content]` entries
- `files.has(path)`, `files.get(path)`, `files.read(path)`, `files.paths()` and `files.size` - read the tree
- `files.write(path, content, {mode?})` and `files.remove(path)` - return a changed tree. A file written without a `mode` gets the default mode when it's created, and keeps its mode when it already exists
- `fromDisk(dir, {glob?, ignore?})` - load a tree from a directory, given as a path or a `URL`. Paths are listed straight away but contents are only read when needed. Dotfiles are loaded (and `*` and `**` match them), `**/.git/**` and `**/node_modules/**` are ignored unless `ignore` replaces them, symbolic links are skipped, and a missing directory loads as an empty tree
- `readText(files, path)` and `writeText(files, path, text, {mode?})` - read and write UTF-8 text

### Content

A file's content is a `Content`: either bytes (a `Uint8Array`) or a `LazyContent`, which is loaded when it's needed. Files loaded by `fromDisk` are lazy content which reads the file on disk the first time it's needed, and shares that read with every tree that holds it.

- `LazyContent` - an interface with `read()`, `stat()` (its `size` and optional `mode`) and an optional `path` to a file on disk which holds the content, so it can be copied without being read. Implement it for other sources of content
- `isLazyContent(content)` - whether the content is lazy rather than bytes

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

Modes are kept, so executable files like `bin` scripts and git hooks stay executable. Files loaded from disk keep their mode, a file written with a mode gets it, and a file written without one gets the default mode when it's created and keeps its mode when it's modified. On Windows, modes are neither applied nor compared.
