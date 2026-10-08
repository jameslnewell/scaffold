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
import {
  Files,
  fromDisk,
  readText,
  toDisk,
  writeText,
} from '@buildscaffold/core/files';

let files = await fromDisk('./my-project');
files = writeText(files, 'greeting.txt', 'Hello!');
files.has('greeting.txt'); // true
await readText(files, 'greeting.txt'); // 'Hello!'
```

- `new Files(entries?)` - a tree from `[path, content]` entries, where content is a `Uint8Array` or a `DiskContent`
- `files.has(path)`, `files.get(path)`, `files.read(path)`, `files.paths()` and `files.size` - read the tree
- `files.write(path, content)` and `files.remove(path)` - return a changed tree
- `fromDisk(dir, {glob?, ignore?})` - load a tree from a directory. Paths are listed straight away but contents are only read when needed. Dotfiles are loaded (and `*` and `**` match them), `**/.git/**` and `**/node_modules/**` are ignored unless `ignore` replaces them, symbolic links are skipped, and a missing directory loads as an empty tree
- `toDisk(dir, files)` - write every file in the tree to a directory, best suited to empty directories and tests
- `readText(files, path)` and `writeText(files, path, text)` - read and write UTF-8 text

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

- `diff(before, after)` - a `Map` of each changed path to a `create`, `modify` or `delete`. A file which is rewritten with identical bytes isn't reported
- `apply(dir, diff)` - write the changes to a directory, deleting any directories left empty

Only files that were replaced are read to compare them, and files loaded from disk are copied natively rather than read into memory (unless the file they're copied from is itself being changed, e.g. when swapping two files), so large directories and files are cheap to diff and apply. Only files that `fromDisk` loaded can be deleted, so ignored files are never touched. File modes aren't tracked.
