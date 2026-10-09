import {Files, writeText} from '../files/index.js';
import {describe, expect, test} from 'vitest';
import type {Scaffold} from './Scaffold.js';
import {pipe} from './pipe.js';
import {write} from './operations.js';

describe(pipe, () => {
  test('passes the tree through each scaffold in order', async () => {
    const order: string[] = [];
    const log =
      (name: string): Scaffold =>
      async (files) => {
        await Promise.resolve();
        order.push(name);
        return files;
      };
    const files = await pipe(
      log('first'),
      write('a.txt', 'a'),
      log('second'),
      async (files) => writeText(files.delete('a.txt'), 'b.txt', ''),
    )(new Files());
    expect(order).toEqual(['first', 'second']);
    expect([...files.keys()]).toEqual(['b.txt']);
  });
});
