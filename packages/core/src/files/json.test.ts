import * as json from './json.js';
import {describe, expect, test} from 'vitest';
import {readText, writeText} from './contents.js';
import {Files} from './Files.js';

describe('json', () => {
  test('read returns undefined when there is no file', async () => {
    await expect(json.read(new Files(), 'a.json')).resolves.toBeUndefined();
  });

  test('read throws when the file is not valid JSON', async () => {
    const files = writeText(new Files(), 'a.json', '{');
    await expect(json.read(files, 'a.json')).rejects.toThrow(
      'File "a.json" is not valid JSON',
    );
  });

  test('write indents with two spaces and ends with a newline', async () => {
    const files = json.write(new Files(), 'a.json', {a: 1});
    await expect(readText(files, 'a.json')).resolves.toBe('{\n  "a": 1\n}\n');
  });

  test('write throws when the value cannot be written as JSON', () => {
    expect(() => json.write(new Files(), 'a.json', undefined)).toThrow(
      `File "a.json" can't be written as JSON`,
    );
  });

  test('transform awaits an async function', async () => {
    const files = await json.transform(new Files(), 'a.json', async () => {
      await Promise.resolve();
      return {a: 1};
    });
    await expect(json.read(files, 'a.json')).resolves.toEqual({a: 1});
  });

  test('transform receives the parsed file', async () => {
    const files = await json.transform(
      json.write(new Files(), 'a.json', {count: 1}),
      'a.json',
      (value) => ({count: (value as {count: number}).count + 1}),
    );
    await expect(json.read(files, 'a.json')).resolves.toEqual({count: 2});
  });

  test('merge creates the file when there is none', async () => {
    const files = await json.merge(new Files(), 'a.json', {a: 1});
    await expect(json.read(files, 'a.json')).resolves.toEqual({a: 1});
  });

  test('merge deeply merges objects and replaces everything else', async () => {
    const files = await json.merge(
      json.write(new Files(), 'package.json', {
        name: 'before',
        keywords: ['a'],
        scripts: {build: 'tsc', test: 'jest'},
      }),
      'package.json',
      {name: 'after', keywords: ['b'], scripts: {test: 'vitest'}},
    );
    await expect(json.read(files, 'package.json')).resolves.toEqual({
      name: 'after',
      keywords: ['b'],
      scripts: {build: 'tsc', test: 'vitest'},
    });
  });

  test('merge keeps a __proto__ key as data', async () => {
    const files = await json.merge(
      writeText(new Files(), 'a.json', '{"__proto__": {"polluted": true}}'),
      'a.json',
      JSON.parse('{"__proto__": {"other": true}}'),
    );
    await expect(readText(files, 'a.json')).resolves.toBe(
      '{\n  "__proto__": {\n    "polluted": true,\n    "other": true\n  }\n}\n',
    );
  });
});
