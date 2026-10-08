import {describe, expectTypeOf, test} from 'vitest';
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
});
