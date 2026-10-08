import {describe, expect, expectTypeOf, test} from 'vitest';
import {defineScaffold} from './define.js';

describe(defineScaffold, () => {
  test('infers the option values from the options', () => {
    defineScaffold({
      options: {
        name: {type: 'string', description: 'Name'},
        count: {type: 'number', description: 'Count', optional: true},
        force: {type: 'boolean', description: 'Force'},
        tags: {type: 'string', description: 'Tags', array: true},
        license: {
          type: 'choice',
          description: 'License',
          choices: ['MIT', 'ISC'],
        },
      },
      scaffold: (options) => {
        expectTypeOf(options).toEqualTypeOf<
          {
            name: string;
            force: boolean;
            tags: string[];
            license: 'MIT' | 'ISC';
          } & {count?: number | undefined}
        >();
        return (files) => files;
      },
    });
  });

  test('allows a scaffold without options', () => {
    defineScaffold({
      scaffold: (options) => {
        expectTypeOf(options).toBeObject();
        return (files) => files;
      },
    });
  });

  test('passes the options and directory to the tasks factory', () => {
    defineScaffold({
      options: {name: {type: 'string', description: 'Name'}},
      scaffold: () => (files) => files,
      tasks: (ctx) => {
        expectTypeOf(ctx.options.name).toBeString();
        expectTypeOf(ctx.directory).toBeString();
        return {type: 'serial', tasks: []};
      },
    });
  });

  test('marks the module without adding an enumerable property', () => {
    const module = defineScaffold({scaffold: () => (files) => files});
    expect(Object.keys(module)).toEqual(['scaffold']);
    expect(
      Object.getOwnPropertySymbols(module).map((symbol) => symbol.description),
    ).toEqual(['@buildscaffold/cli/scaffold-module']);
  });
});
