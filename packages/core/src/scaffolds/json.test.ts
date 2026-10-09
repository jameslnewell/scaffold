import * as json from './json.js';
import {Files, json as jsonFiles} from '../files/index.js';
import {describe, expect, test} from 'vitest';
import {pipe} from './pipe.js';

describe('json', () => {
  test('merge and transform wrap the operations as scaffolds', async () => {
    const files = await pipe(
      json.merge('package.json', {name: 'a', scripts: {test: 'vitest'}}),
      json.transform('package.json', (value) => ({
        ...(value as object),
        private: true,
      })),
    )(new Files());
    await expect(jsonFiles.read(files, 'package.json')).resolves.toEqual({
      name: 'a',
      private: true,
      scripts: {test: 'vitest'},
    });
  });
});
