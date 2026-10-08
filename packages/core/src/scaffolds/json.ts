import type {Scaffold} from './Scaffold.js';
import {json} from '../files/index.js';

/**
 * A scaffold which deeply merges the value into a JSON file, creating the file when there is none.
 *
 * @see `json.merge` in `@buildscaffold/core/files`
 * @example
 * json.merge('package.json', {scripts: {test: 'vitest'}})
 */
export function merge(file: string, value: unknown): Scaffold {
  return (files) => json.merge(files, file, value);
}

/**
 * A scaffold which replaces a JSON file with the result of a function. The function receives `undefined` when
 * there is no file.
 *
 * @see `json.transform` in `@buildscaffold/core/files`
 * @example
 * json.transform('tsconfig.json', (config) => ({...config, include: ['src']}))
 */
export function transform(
  file: string,
  fn: (value: unknown) => unknown,
): Scaffold {
  return (files) => json.transform(files, file, fn);
}
