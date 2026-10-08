import {describe, expect, test} from 'vitest';
import type {ScaffoldOptions} from './define.js';
import {extractOptionsFromYargsArgv} from './extractOptionsFromYargsArgv.js';

const options = {
  name: {type: 'string', description: 'Name'},
  count: {type: 'number', description: 'Count', optional: true},
  tags: {type: 'string', description: 'Tags', array: true, optional: true},
  license: {
    type: 'choice',
    description: 'License',
    choices: ['MIT', 'ISC'],
    optional: true,
  },
} satisfies ScaffoldOptions;

describe(extractOptionsFromYargsArgv, () => {
  test('extracts the values', async () => {
    const result = await extractOptionsFromYargsArgv({
      options,
      argv: ['--name', 'Bob', '--count', '2', '--tags', 'a', '--tags', 'b'],
    });
    expect(result).toMatchObject({
      values: {name: 'Bob', count: 2, tags: ['a', 'b']},
      missing: [],
    });
  });

  test('wraps a single value of an array option in an array', async () => {
    const result = await extractOptionsFromYargsArgv({
      options,
      argv: ['--name', 'Bob', '--tags', 'a'],
    });
    expect(result).toMatchObject({values: {tags: ['a']}});
  });

  test('reports missing required options', async () => {
    const result = await extractOptionsFromYargsArgv({options, argv: []});
    expect(result).toMatchObject({values: {}, missing: ['name']});
  });

  test('reports a required option given without a value as missing', async () => {
    const result = await extractOptionsFromYargsArgv({
      options,
      argv: ['--name'],
    });
    expect(result).toMatchObject({values: {}, missing: ['name']});
  });

  test('reports numbers which are not numbers', async () => {
    const result = await extractOptionsFromYargsArgv({
      options,
      argv: ['--name', 'Bob', '--count', 'abc'],
    });
    expect(result.error).toBe('Option --count must be a number');
  });

  test('does not exit for --help', async () => {
    const result = await extractOptionsFromYargsArgv({
      options,
      argv: ['--help'],
    });
    expect(result.error).toMatch(/unknown/i);
  });

  test('reports unknown options', async () => {
    const result = await extractOptionsFromYargsArgv({
      options,
      argv: ['--name', 'Bob', '--unknown'],
    });
    expect(result.error).toMatch(/unknown/i);
  });

  test('reports invalid choices', async () => {
    const result = await extractOptionsFromYargsArgv({
      options,
      argv: ['--name', 'Bob', '--license', 'GPL'],
    });
    expect(result.error).toMatch(/invalid values/i);
  });
});
