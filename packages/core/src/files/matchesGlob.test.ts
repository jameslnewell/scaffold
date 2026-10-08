import {describe, expect, test} from 'vitest';
import {matchesGlob} from './matchesGlob.js';

describe(matchesGlob, () => {
  test.each([
    ['templates/.gitignore', 'templates/**', true],
    ['.github/workflows/ci.yml', '**/*.yml', true],
    ['.eslintrc.json', '*.json', true],
    ['a/.git/HEAD', '**/.git/**', true],
    ['.env', '.env', true],
    ['src/a.ts', 'src/*.ts', true],
    ['src/a.ts', 'lib/**', false],
    ['env', '.*', false],
  ])('%s matches %s is %s', (file, glob, expected) => {
    expect(matchesGlob(file, glob)).toBe(expected);
  });
});
