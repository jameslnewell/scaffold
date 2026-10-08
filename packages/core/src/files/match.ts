import * as path from 'node:path';
import type {Files} from './Files.js';
import {matchesGlob} from './matchesGlob.js';

const GLOB_CHARACTERS = /[*?[\]{}()!]/;

export interface MatchOptions {
  /** Skip files which match these globs */
  ignore?: string[] | undefined;
}

interface Match {
  file: string;
  /** The path relative to the matched directory or glob base, or `undefined` when a file was matched */
  relative: string | undefined;
}

/**
 * Match a file, the files in a directory (`.` for the whole tree), or the files matching a glob.
 */
export function match(
  files: Files,
  source: string,
  {ignore = []}: MatchOptions = {},
): Match[] {
  const normalized = path.posix.normalize(source).replace(/\/$/, '');
  const prefix = normalized === '.' ? '' : `${normalized}/`;

  // a file or directory is matched before a glob, so a name with glob characters in it e.g. `[id].tsx` or
  // `(auth)` is still matched
  let matches: Match[];
  if (normalized !== '.' && files.has(normalized)) {
    matches = [{file: normalized, relative: undefined}];
  } else if (files.paths().some((file) => file.startsWith(prefix))) {
    matches = files
      .paths()
      .filter((file) => file.startsWith(prefix))
      .map((file) => ({file, relative: file.slice(prefix.length)}));
  } else if (GLOB_CHARACTERS.test(normalized)) {
    const base = globBase(normalized);
    matches = files
      .paths()
      .filter((file) => matchesGlob(file, normalized))
      .map((file) => ({file, relative: path.posix.relative(base, file)}));
  } else {
    matches = [];
  }

  matches = matches.filter(
    ({file}) => !ignore.some((pattern) => matchesGlob(file, pattern)),
  );
  if (matches.length === 0) {
    throw new Error(`No files matched "${source}"`);
  }
  return matches;
}

// the leading directories which don't contain any glob characters e.g. `src/templates` for `src/templates/**/*.ts`
function globBase(glob: string): string {
  const segments = glob.split('/');
  const index = segments.findIndex((segment) => GLOB_CHARACTERS.test(segment));
  return segments.slice(0, index).join('/') || '.';
}
