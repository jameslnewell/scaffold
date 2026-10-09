import {readText, writeText} from './contents.js';
import type {Files} from './Files.js';

/**
 * Parse a JSON file, or `undefined` when there is no file.
 *
 * @example
 * const pkg = await json.read(files, 'package.json');
 */
export async function read(files: Files, file: string): Promise<unknown> {
  const text = await readText(files, file);
  if (text === undefined) return undefined;
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new Error(`File "${file}" is not valid JSON`, {cause});
  }
}

/**
 * A new tree with the file replaced by the value as JSON, indented with two spaces.
 *
 * @example
 * files = json.write(files, 'package.json', {name: 'my-package'});
 */
export function write(files: Files, file: string, value: unknown): Files {
  // JSON.stringify() returns undefined rather than throwing for values like undefined and functions
  const text = JSON.stringify(value, null, 2) as string | undefined;
  if (text === undefined) {
    throw new Error(`File "${file}" can't be written as JSON`);
  }
  return writeText(files, file, `${text}\n`);
}

/**
 * A new tree with the JSON file replaced by the result of a function, which may be async. The function receives `undefined` when
 * there is no file.
 *
 * @example
 * files = await json.transform(files, 'tsconfig.json', (config) => ({...config, include: ['src']}));
 */
export async function transform(
  files: Files,
  file: string,
  fn: (value: unknown) => unknown,
): Promise<Files> {
  return write(files, file, await fn(await read(files, file)));
}

/**
 * A new tree with the value deeply merged into the JSON file, creating the file when there is none.
 *
 * Objects are merged key by key, and anything else (including arrays) in the value replaces what is in the file.
 *
 * @example
 * files = await json.merge(files, 'package.json', {scripts: {test: 'vitest'}});
 */
export async function merge(
  files: Files,
  file: string,
  value: unknown,
): Promise<Files> {
  return transform(files, file, (existing) => deepMerge(existing, value));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge(target: unknown, source: unknown): unknown {
  if (!isPlainObject(target) || !isPlainObject(source)) return source;
  const keys = new Set([...Object.keys(target), ...Object.keys(source)]);
  // builds a new object from entries rather than assigning keys, so a `__proto__` key is kept as data
  return Object.fromEntries(
    [...keys].map((key) => [
      key,
      Object.hasOwn(source, key)
        ? deepMerge(target[key], source[key])
        : target[key],
    ]),
  );
}
