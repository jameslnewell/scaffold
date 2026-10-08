import * as path from 'node:path';

// a private-use character which no real path contains
const DOT_ESCAPE = '';

export function matchesGlob(file: string, glob: string): boolean {
  // path.matchesGlob() never matches names starting with a dot with `*` or `**`, and has no option to, but
  // scaffolds mostly want them matched e.g. `.gitignore` in `templates/**`. Prefixing each leading dot lets
  // wildcards match them, and also trying the original path keeps patterns which spell out the dot working.
  return (
    path.posix.matchesGlob(file, glob) ||
    path.posix.matchesGlob(file.replace(/(^|\/)\./g, `$1${DOT_ESCAPE}.`), glob)
  );
}
